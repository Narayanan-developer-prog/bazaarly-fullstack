
from django.core.management.base import BaseCommand
from store.models import Product


PRODUCTS = [
    {
        "name": "Smartwatch with Heart Rate Monitor",
        "category": "Electronics",
        "emoji": "⌚",
        "price": 2299,
        "mrp": 4499,
        "rating": 4.1,
        "reviews": 8320,
    },
    {
        "name": "65W Fast Charging Power Bank 20000mAh",
        "category": "Electronics",
        "emoji": "🔋",
        "price": 1199,
        "mrp": 1999,
        "rating": 4.4,
        "reviews": 5410,
    },
    {
        "name": "Mechanical Gaming Keyboard RGB",
        "category": "Electronics",
        "emoji": "⌨️",
        "price": 2799,
        "mrp": 4999,
        "rating": 4.5,
        "reviews": 3210,
    },
    {
        "name": "Men's Cotton Casual Shirt",
        "category": "Fashion",
        "emoji": "👕",
        "price": 599,
        "mrp": 1299,
        "rating": 4.0,
        "reviews": 2140,
    },
    {
        "name": "Women's Ethnic Kurti Set",
        "category": "Fashion",
        "emoji": "👗",
        "price": 899,
        "mrp": 1799,
        "rating": 4.2,
        "reviews": 4310,
    },
    {
        "name": "Running Shoes, Lightweight Mesh",
        "category": "Fashion",
        "emoji": "👟",
        "price": 1699,
        "mrp": 2999,
        "rating": 4.3,
        "reviews": 9870,
    },
    {
        "name": "Leather Wallet for Men",
        "category": "Fashion",
        "emoji": "👛",
        "price": 449,
        "mrp": 899,
        "rating": 4.1,
        "reviews": 1560,
    },
    {
        "name": "Non-Stick Cookware Set, 5 Piece",
        "category": "Home",
        "emoji": "🍳",
        "price": 1899,
        "mrp": 3499,
        "rating": 4.4,
        "reviews": 2870,
    },
    {
        "name": "LED Table Lamp with USB Port",
        "category": "Home",
        "emoji": "💡",
        "price": 599,
        "mrp": 999,
        "rating": 4.2,
        "reviews": 1230,
    },
    {
        "name": "Memory Foam Pillow, Set of 2",
        "category": "Home",
        "emoji": "🛏️",
        "price": 799,
        "mrp": 1499,
        "rating": 4.0,
        "reviews": 3400,
    },
    {
        "name": "Stainless Steel Water Bottle 1L",
        "category": "Home",
        "emoji": "🍶",
        "price": 349,
        "mrp": 699,
        "rating": 4.3,
        "reviews": 6540,
    },
    {
        "name": "Atomic Habits - Paperback",
        "category": "Books",
        "emoji": "📘",
        "price": 299,
        "mrp": 499,
        "rating": 4.7,
        "reviews": 22100,
    },
    {
        "name": "The Alchemist - Paperback",
        "category": "Books",
        "emoji": "📗",
        "price": 199,
        "mrp": 399,
        "rating": 4.6,
        "reviews": 31200,
    },
    {
        "name": "Data Structures & Algorithms Guide",
        "category": "Books",
        "emoji": "📙",
        "price": 449,
        "mrp": 799,
        "rating": 4.4,
        "reviews": 1870,
    },
    {
        "name": "Yoga Mat, Anti-Slip 6mm",
        "category": "Sports",
        "emoji": "🧘",
        "price": 499,
        "mrp": 999,
        "rating": 4.2,
        "reviews": 4120,
    },
    {
        "name": "Adjustable Dumbbell Set 10kg",
        "category": "Sports",
        "emoji": "🏋️",
        "price": 1599,
        "mrp": 2799,
        "rating": 4.3,
        "reviews": 2340,
    },
    {
        "name": "Cricket Bat, Kashmir Willow",
        "category": "Sports",
        "emoji": "🏏",
        "price": 899,
        "mrp": 1599,
        "rating": 4.1,
        "reviews": 980,
    },
    {
        "name": "Vitamin C Face Serum",
        "category": "Beauty",
        "emoji": "🧴",
        "price": 449,
        "mrp": 899,
        "rating": 4.3,
        "reviews": 7650,
    },
    {
        "name": "Herbal Shampoo, 340ml",
        "category": "Beauty",
        "emoji": "🧴",
        "price": 249,
        "mrp": 449,
        "rating": 4.1,
        "reviews": 5230,
    },
]


class Command(BaseCommand):
    help = "Add or update Bazaarly demo products in PostgreSQL."

    def handle(self, *args, **options):
        for data in PRODUCTS:
            Product.objects.update_or_create(
                name=data["name"],
                defaults=data,
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"Processed {len(PRODUCTS)} products in PostgreSQL."
            )
        )
