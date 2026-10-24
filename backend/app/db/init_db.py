import logging
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.user import User
from app.models.vehicle import Vehicle
from app.models.transaction import InventoryTransaction
from app.db.session import SessionLocal, Base, engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

SAMPLE_VEHICLES = [
    {
        "vin": "WP0AA2A96PS298101",
        "make": "Porsche",
        "model": "911 Carrera GTS",
        "category": "Coupe",
        "year": 2024,
        "price": 158200.00,
        "quantity": 3,
        "color": "Chalk Gray",
        "mileage": 1200,
        "fuel_type": "Gasoline",
        "transmission": "Automatic",
        "description": "Twin-turbocharged 3.0L flat-six producing 473 hp. Aerokit package, sport exhaust system, and ceramic composite brakes.",
        "image_url": "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
    },
    {
        "vin": "5YJSA1E41PF498212",
        "make": "Tesla",
        "model": "Model S Plaid",
        "category": "Sedan",
        "year": 2024,
        "price": 89990.00,
        "quantity": 5,
        "color": "Midnight Silver Metallic",
        "mileage": 450,
        "fuel_type": "Electric",
        "transmission": "Automatic",
        "description": "Tri-motor all-wheel drive platform generating 1,020 horsepower. 0-60 mph in 1.99s with carbon sleeve rotors and 359 miles range.",
        "image_url": "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1200&q=80",
    },
    {
        "vin": "WBA33AY08PFP10294",
        "make": "BMW",
        "model": "M3 Competition xDrive",
        "category": "Sedan",
        "year": 2023,
        "price": 84300.00,
        "quantity": 2,  # Low stock
        "color": "Isle of Man Green",
        "mileage": 6400,
        "fuel_type": "Gasoline",
        "transmission": "Automatic",
        "description": "3.0L BMW M TwinPower Turbo inline 6-cylinder engine with 503 hp. Carbon fiber bucket seats, M Drive Professional and laser headlights.",
        "image_url": "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80",
    },
    {
        "vin": "W1N4632761X891045",
        "make": "Mercedes-Benz",
        "model": "AMG G 63",
        "category": "SUV",
        "year": 2024,
        "price": 182000.00,
        "quantity": 1,  # Low stock
        "color": "Obsidian Black",
        "mileage": 2800,
        "fuel_type": "Gasoline",
        "transmission": "Automatic",
        "description": "Handcrafted AMG 4.0L V8 biturbo engine with 577 hp. AMG Ride Control suspension, 22-inch forged cross-spoke wheels, and designo leather.",
        "image_url": "https://images.unsplash.com/photo-1520050206274-a1ae44613e6d?auto=format&fit=crop&w=1200&q=80",
    },
    {
        "vin": "1FT6W1EV7PW764201",
        "make": "Ford",
        "model": "F-150 Lightning Platinum",
        "category": "Truck",
        "year": 2024,
        "price": 91995.00,
        "quantity": 4,
        "color": "Star White",
        "mileage": 850,
        "fuel_type": "Electric",
        "transmission": "Automatic",
        "description": "Dual electric motors delivering 580 hp and 775 lb-ft of torque. Pro Power Onboard 9.6kW generator, extended-range battery, and BlueCruise.",
        "image_url": "https://images.unsplash.com/photo-1605893477799-b99e3b8b93fe?auto=format&fit=crop&w=1200&q=80",
    },
    {
        "vin": "WAUZZZF27PN023491",
        "make": "Audi",
        "model": "RS6 Avant",
        "category": "Wagon",
        "year": 2023,
        "price": 125800.00,
        "quantity": 0,  # Out of stock
        "color": "Nardo Gray",
        "mileage": 9100,
        "fuel_type": "Gasoline",
        "transmission": "Automatic",
        "description": "4.0-liter twin-turbo V8 producing 591 hp paired with quattro all-wheel drive. Dynamic ride control and Bang & Olufsen Advanced 3D sound.",
        "image_url": "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&w=1200&q=80",
    },
    {
        "vin": "1G1YC2D40P5104822",
        "make": "Chevrolet",
        "model": "Corvette Z06 3LZ",
        "category": "Coupe",
        "year": 2024,
        "price": 128900.00,
        "quantity": 3,
        "color": "Torch Red",
        "mileage": 140,
        "fuel_type": "Gasoline",
        "transmission": "Automatic",
        "description": "Flat-plane crank 5.5L naturally aspirated V8 revving to 8,600 RPM. 670 hp, Z07 Performance package with carbon ceramic brakes.",
        "image_url": "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
    },
    {
        "vin": "7FCTGAAAXPN014892",
        "make": "Rivian",
        "model": "R1T Adventure",
        "category": "Truck",
        "year": 2023,
        "price": 87000.00,
        "quantity": 2,
        "color": "Rivian Blue",
        "mileage": 7200,
        "fuel_type": "Electric",
        "transmission": "Automatic",
        "description": "Quad-Motor AWD producing 835 horsepower. Max Pack battery, Camp Kitchen option, Gear Guard security, and independent air suspension.",
        "image_url": "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=1200&q=80",
    },
    {
        "vin": "SALWR2V42PA839103",
        "make": "Land Rover",
        "model": "Range Rover Autobiography",
        "category": "SUV",
        "year": 2024,
        "price": 168400.00,
        "quantity": 3,
        "color": "Belgravia Green",
        "mileage": 3100,
        "fuel_type": "Hybrid",
        "transmission": "Automatic",
        "description": "4.4L Twin-Turbocharged V8 with 523 hp. Executive Class Comfort rear seating, all-wheel steering, and Meridian Signature sound.",
        "image_url": "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80",
    },
    {
        "vin": "JTDB43026NP038291",
        "make": "Toyota",
        "model": "GR Supra 3.0 Premium",
        "category": "Coupe",
        "year": 2023,
        "price": 57500.00,
        "quantity": 4,
        "color": "Nitro Yellow",
        "mileage": 4200,
        "fuel_type": "Gasoline",
        "transmission": "Manual",
        "description": "6-speed intelligent Manual Transmission (iMT) paired with 3.0L turbocharged inline-six (382 hp). Active rear sport differential.",
        "image_url": "https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?auto=format&fit=crop&w=1200&q=80",
    },
    {
        "vin": "57A6E4AA3PA003810",
        "make": "Lucid",
        "model": "Air Grand Touring",
        "category": "Sedan",
        "year": 2023,
        "price": 109900.00,
        "quantity": 2,
        "color": "Cosmos Silver",
        "mileage": 5100,
        "fuel_type": "Electric",
        "transmission": "Automatic",
        "description": "Dual active-core motors generating 819 horsepower with up to 516 miles EPA estimated range. Glass Canopy roof and Surreal Sound Pro.",
        "image_url": "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80",
    },
    {
        "vin": "1GYS4HKJ7PR218042",
        "make": "Cadillac",
        "model": "Escalade-V",
        "category": "SUV",
        "year": 2024,
        "price": 154290.00,
        "quantity": 0,  # Out of stock
        "color": "Black Raven",
        "mileage": 1800,
        "fuel_type": "Gasoline",
        "transmission": "Automatic",
        "description": "Supercharged 6.2L V8 delivering 682 hp and 653 lb-ft torque. Brembo performance brakes, AKG Studio Reference 36-speaker sound system.",
        "image_url": "https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=1200&q=80",
    },
]


def init_db(db: Session = None) -> None:
    """Initializes tables and seeds default admin, sample users, and vehicles."""
    Base.metadata.create_all(bind=engine)

    close_at_end = False
    if db is None:
        db = SessionLocal()
        close_at_end = True

    try:
        # Seed Admin User
        admin_email = settings.INITIAL_ADMIN_EMAIL
        admin = db.query(User).filter(User.email == admin_email).first()
        if not admin:
            admin = User(
                email=admin_email,
                full_name=settings.INITIAL_ADMIN_NAME,
                hashed_password=get_password_hash(settings.INITIAL_ADMIN_PASSWORD),
                role="ADMIN",
                is_active=True,
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
            logger.info(f"Initialized default dev administrator: {admin.email}")
        else:
            logger.info("Admin user already exists.")

        # Seed Standard Customer
        customer_email = "customer@apexmotors.com"
        customer = db.query(User).filter(User.email == customer_email).first()
        if not customer:
            customer = User(
                email=customer_email,
                full_name="Jane Doe (Customer)",
                hashed_password=get_password_hash("CustomerPass2026!"),
                role="USER",
                is_active=True,
            )
            db.add(customer)
            db.commit()
            db.refresh(customer)
            logger.info(f"Initialized sample customer account: {customer.email}")

        # Seed Vehicles if inventory is empty
        vehicle_count = db.query(Vehicle).count()
        if vehicle_count == 0:
            logger.info(f"Seeding {len(SAMPLE_VEHICLES)} realistic luxury/performance vehicles...")
            created_vehicles = []
            for v_data in SAMPLE_VEHICLES:
                vehicle = Vehicle(**v_data)
                db.add(vehicle)
                created_vehicles.append(vehicle)
            db.commit()

            # Record initial inventory load transactions
            for v in created_vehicles:
                db.refresh(v)
                if v.quantity > 0:
                    tx = InventoryTransaction(
                        vehicle_id=v.id,
                        user_id=admin.id,
                        transaction_type="RESTOCK",
                        quantity_change=v.quantity,
                        unit_price=float(v.price),
                        total_amount=float(v.price * v.quantity),
                        notes=f"Initial inventory consignment for {v.year} {v.make} {v.model}.",
                    )
                    db.add(tx)
            db.commit()
            logger.info("Seeded initial inventory and transaction audit records.")
        else:
            logger.info(f"Database already contains {vehicle_count} vehicles.")

    finally:
        if close_at_end:
            db.close()


if __name__ == "__main__":
    init_db()
