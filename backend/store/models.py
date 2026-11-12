
from django.db import models
from accounts.models import Customer


class Product(models.Model):
    name = models.CharField(max_length=250)
    category = models.CharField(max_length=100)
    emoji = models.CharField(max_length=20, default="📦")
    price = models.PositiveIntegerField()
    mrp = models.PositiveIntegerField()
    rating = models.FloatField(default=0)
    reviews = models.PositiveIntegerField(default=0)

    def __str__(self):
        return self.name


class Order(models.Model):
    STATUS_CHOICES = [
        ("placed", "Placed"),
    ]

    customer = models.ForeignKey(
        Customer,
        on_delete=models.PROTECT,
        related_name="orders",
    )
    user_email = models.EmailField()
    subtotal = models.PositiveIntegerField()
    delivery = models.PositiveIntegerField()
    total = models.PositiveIntegerField()
    address = models.TextField()
    status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default="placed",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Order #{self.pk} - {self.user_email}"


class OrderItem(models.Model):
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="items",
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    product_name = models.CharField(max_length=250)
    price = models.PositiveIntegerField()
    qty = models.PositiveIntegerField()
    line_total = models.PositiveIntegerField()

    def __str__(self):
        return self.product_name
