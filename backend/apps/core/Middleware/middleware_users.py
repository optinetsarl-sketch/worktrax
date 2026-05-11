from django.http import JsonResponse

class RoleMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
    def __call__(self, request):
        if request.user.is_authenticated:
            if not request.user.role:
                return JsonResponse(
                    {"error": "Aucun rôle assigné"},
                    status=403
                )
        return self.get_response(request)



# from django.http import JsonResponse

# class SuperAdminMiddleware:
#     def __init__(self, get_response):
#         self.get_response = get_response

#     def __call__(self, request):

#         # Exemple : protéger une route
#         protected_paths = ["/api/admin/"]
#         if any(request.path.startswith(path) for path in protected_paths):
#             if not request.user.is_authenticated:
#                 return JsonResponse({"error": "Non authentifié"}, status=401)
#             if not hasattr(request.user, "role") or request.user.role.name != "super_admin":
#                 return JsonResponse({"error": "Accès refusé"}, status=403)

#         return self.get_response(request)