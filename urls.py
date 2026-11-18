from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from apps.accounts.views import LoginView, LogoutView, MeView, SettingViewSet, UserViewSet
from apps.audit.views import AuditLogViewSet
from apps.custody.views import CustodyViewSet
from apps.evidence.views import EvidenceViewSet
from apps.investigations.views import CaseViewSet, DashboardView
from apps.reports.views import ReportViewSet
from apps.verification.views import VerificationViewSet

router = DefaultRouter()
router.register("users", UserViewSet, "user")
router.register("settings", SettingViewSet, "setting")
router.register("cases", CaseViewSet, "case")
router.register("evidence", EvidenceViewSet, "evidence")
router.register("verifications", VerificationViewSet, "verification")
router.register("custody", CustodyViewSet, "custody")
router.register("audit-logs", AuditLogViewSet, "auditlog")
router.register("reports", ReportViewSet, "report")

urlpatterns = [
    path("api/auth/login/", LoginView.as_view()),
    path("api/auth/refresh/", TokenRefreshView.as_view()),
    path("api/auth/logout/", LogoutView.as_view()),
    path("api/auth/me/", MeView.as_view()),
    path("api/dashboard/", DashboardView.as_view()),
    path("api/", include(router.urls)),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema")),
]
