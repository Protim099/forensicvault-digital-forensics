import hashlib
import tempfile
from pathlib import Path
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework.test import APITestCase
from apps.accounts.models import User
from apps.audit.models import AuditLog
from apps.custody.models import CustodyEvent
from apps.evidence.models import EvidenceFile
from apps.investigations.models import Case

TMP = tempfile.mkdtemp()
CONTENT = b"forensic evidence bytes\n" * 1000


@override_settings(PRIVATE_MEDIA_ROOT=Path(TMP))
class CoreTests(APITestCase):
    def setUp(self):
        mk = lambda n, r: User.objects.create_user(n, f"{n}@x.com", "StrongPass!123", role=r)
        self.inv, self.rev, self.adm = mk("inv", "investigator"), mk("rev", "reviewer"), mk("adm", "admin")
        self.client.force_authenticate(self.inv)
        r = self.client.post("/api/cases/", {"title": "T", "category": "malware", "priority": "high"}, format="json")
        self.assertEqual(r.status_code, 201, r.data)
        self.case = Case.objects.get(pk=r.data["id"]); self.case.reviewers.add(self.rev)

    def upload(self, name="a.txt", data=CONTENT):
        return self.client.post("/api/evidence/", {"case": str(self.case.id), "title": "E", "file": SimpleUploadedFile(name, data)}, format="multipart")

    def test_login_and_failed_login_audited(self):
        self.client.handler._force_user = None
        ok = self.client.post("/api/auth/login/", {"username": "inv", "password": "StrongPass!123"}, format="json")
        self.assertEqual(ok.status_code, 200); self.assertIn("access", ok.data)
        bad = self.client.post("/api/auth/login/", {"username": "inv", "password": "nope"}, format="json")
        self.assertEqual(bad.status_code, 401)
        self.assertTrue(AuditLog.objects.filter(action="LOGIN").exists())
        self.assertTrue(AuditLog.objects.filter(action="LOGIN_FAILED").exists())

    def test_role_permissions(self):
        self.client.force_authenticate(self.rev)
        self.assertEqual(self.client.post("/api/cases/", {"title": "x", "category": "c"}, format="json").status_code, 403)
        self.assertEqual(self.upload().status_code, 403)
        self.assertEqual(self.client.get("/api/audit-logs/").status_code, 403)
        self.assertEqual(self.client.get("/api/cases/").status_code, 200)
        self.client.force_authenticate(self.adm)
        self.assertEqual(self.client.get("/api/audit-logs/").status_code, 200)

    def test_upload_validation(self):
        for bad in ("x.exe", "x.html", "x.svg", "x.sh"):
            self.assertEqual(self.upload(bad).status_code, 400, bad)
        self.assertEqual(self.upload("fake.png", b"not an image").status_code, 400)

    def test_sha256_calculated_on_server(self):
        r = self.upload()
        self.assertEqual(r.status_code, 201, r.data)
        self.assertEqual(r.data["sha256"], hashlib.sha256(CONTENT).hexdigest())
        self.assertNotIn(".txt", r.data["storage_path"])  # randomized server-side name

    def test_verify_ok_mismatch_missing_and_history_preserved(self):
        ev = EvidenceFile.objects.get(pk=self.upload().data["id"])
        orig = ev.hash.sha256
        v = lambda: self.client.post(f"/api/evidence/{ev.id}/verify/").data["result"]
        self.assertEqual(v(), "VERIFIED")
        p = Path(TMP) / ev.storage_path
        p.write_bytes(CONTENT + b"tampered")
        self.assertEqual(v(), "INTEGRITY_MISMATCH")
        ev.refresh_from_db(); self.assertEqual(ev.hash.sha256, orig); self.assertEqual(ev.status, "flagged")
        p.unlink()
        self.assertEqual(v(), "FILE_MISSING")
        self.assertEqual(ev.verifications.count(), 3)

    def test_custody_recorded_and_immutable(self):
        ev = EvidenceFile.objects.get(pk=self.upload().data["id"])
        acts = list(ev.custody_events.values_list("action", flat=True))
        self.assertEqual(acts[:2], ["EVIDENCE_CREATED", "EVIDENCE_UPLOADED"])
        r = self.client.post(f"/api/evidence/{ev.id}/transfer/", {"new_custodian": str(self.rev.id), "reason": ""}, format="json")
        self.assertEqual(r.status_code, 400)
        r = self.client.post(f"/api/evidence/{ev.id}/transfer/", {"new_custodian": str(self.rev.id), "reason": "Peer review"}, format="json")
        self.assertEqual(r.status_code, 201)
        e = CustodyEvent.objects.filter(action="EVIDENCE_TRANSFERRED").first()
        self.assertEqual(e.previous_custodian, self.inv); self.assertEqual(e.new_custodian, self.rev)
        e.notes = "edit"
        with self.assertRaises(PermissionError): e.save()
        with self.assertRaises(PermissionError): e.delete()
        self.assertEqual(self.client.patch(f"/api/custody/{e.id}/", {}, format="json").status_code, 405)

    def test_audit_created_and_immutable(self):
        self.upload()
        log = AuditLog.objects.filter(action="EVIDENCE_UPLOADED").first()
        self.assertIsNotNone(log)
        with self.assertRaises(PermissionError): log.delete()

    def test_pdf_report(self):
        self.upload()
        r = self.client.post("/api/reports/", {"case": str(self.case.id), "findings": "f", "conclusion": "c"}, format="json")
        self.assertEqual(r.status_code, 201, r.data)
        d = self.client.get(f"/api/reports/{r.data['id']}/download/")
        self.assertEqual(d.status_code, 200)
        self.assertTrue(b"".join(d.streaming_content).startswith(b"%PDF"))
        r2 = self.client.post("/api/reports/", {"case": str(self.case.id)}, format="json")
        self.assertEqual(r2.data["version"], 2)
        self.client.force_authenticate(self.rev)
        ok = self.client.post(f"/api/reports/{r.data['id']}/review/", {"decision": "approved"}, format="json")
        self.assertEqual(ok.data["status"], "approved")
