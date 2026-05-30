from django.contrib import admin
from .models import Product, Order, Category, Cart, Wishlist, Banner, GoogleUser, OrderNotification, AdminContact


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at')
    search_fields = ('name',)
    ordering = ('name',)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'stock', 'featured', 'popularity', 'created_at')
    list_filter = ('category', 'featured', 'created_at')
    search_fields = ('name', 'description')
    ordering = ('-created_at',)
    fieldsets = (
        ('Product Information', {
            'fields': ('name', 'description', 'category', 'price', 'stock')
        }),
        ('Images', {
            'fields': ('image_url', 'category_image', 'banner_image')
        }),
        ('Product Details', {
            'fields': ('sizes', 'popularity', 'featured')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'customer_name', 'customer_email', 'total_amount', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('customer_name', 'customer_email')
    ordering = ('-created_at',)
    fieldsets = (
        ('Customer Information', {
            'fields': ('customer_name', 'customer_email', 'address')
        }),
        ('Order Details', {
            'fields': ('items', 'total_amount', 'status')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ('user', 'created_at', 'updated_at')
    list_filter = ('created_at',)
    search_fields = ('user__email', 'user__username')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Wishlist)
class WishlistAdmin(admin.ModelAdmin):
    list_display = ('user', 'created_at', 'updated_at')
    search_fields = ('user__email', 'user__username')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Banner)
class BannerAdmin(admin.ModelAdmin):
    list_display = ('title', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('title', 'description')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at')


@admin.register(GoogleUser)
class GoogleUserAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'google_id', 'user', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('name', 'email', 'google_id')
    ordering = ('-created_at',)
    readonly_fields = ('google_id', 'created_at', 'updated_at')
    fieldsets = (
        ('User Information', {
            'fields': ('name', 'email', 'picture')
        }),
        ('Google OAuth', {
            'fields': ('google_id', 'user')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(OrderNotification)
class OrderNotificationAdmin(admin.ModelAdmin):
    list_display = ('order', 'customer_name', 'customer_email', 'total_amount', 'is_read', 'created_at')
    list_filter = ('is_read', 'created_at')
    search_fields = ('order__order_number', 'customer_name', 'customer_email')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'read_at')
    fieldsets = (
        ('Order Information', {
            'fields': ('order', 'customer_name', 'customer_email')
        }),
        ('Order Details', {
            'fields': ('total_amount', 'items_count', 'items_summary')
        }),
        ('Customer Information', {
            'fields': ('phone', 'city', 'address', 'pincode')
        }),
        ('Notification Status', {
            'fields': ('is_read', 'created_at', 'read_at')
        }),
    )


@admin.register(AdminContact)
class AdminContactAdmin(admin.ModelAdmin):
    list_display = ('admin_name', 'whatsapp_number', 'email', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('admin_name', 'whatsapp_number', 'email')
    ordering = ('-is_active', '-created_at')
    fieldsets = (
        ('Admin Information', {
            'fields': ('admin_name', 'whatsapp_number', 'email', 'phone')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ('created_at', 'updated_at')


