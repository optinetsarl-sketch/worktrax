from django.contrib import admin
from .models import Role, Permission, ColumnPermission, User

admin.site.register(Role)
admin.site.register(Permission)
admin.site.register(ColumnPermission)
admin.site.register(User)