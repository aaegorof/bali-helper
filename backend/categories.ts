// Список категорий транзакций
const transactionCategories = [
  "Cafe/Restaurant",
  "Supermarket/Products",
  "Transfers/Payments",
  "Bills",
  "Entertainment",
  "Shopping",
  "Tourism",
  "Accommodations",
  "Groceries",
  "Transportation",
  "Wellness",
  "Health",
  "Beauty",
  "Education",
  "Home",
  "Pets",
  "Events",
  "Online",
  "Utilities",
] as const;

const cafeRestaurantKeywords: string[] = [
  "cafe",
  "coffee",
  "resto",
  "restaurant",
  "warung",
  "bistro",
  "bar",
  "eatery",
  "lounge",
  "kitchen",
  "grill",
  "bakery",
  "smoothie",
  "juice",
  "ice cream",
  "kopi",
  "makan",
  "minum",
  "dinner",
  "lunch",
  "breakfast",
  "brunch",
  "food",
  "drink",
  "tabu",
  "ohama",
  "Nourish",
  "Alchemy",
  "crumb and coaster",
  "My Berry Cafe",
  "Winter Cafe",
  "Nectar Bali",
  "Tarragon",
  "Sayah House",
  "Bambu Fitness",
  "St Bernard",
  "Folk Ho",
  "Brie",
  "Bench Brewery",
  "the loft",
  "Living Stone",
  "Lolas",
  "Islands foods",
  "La Cima Grun",
  "Analog",
  "Blacklist",
  "Home of Beyondmilk",
  "Plantie's",
  "Usha",
  "The Bench Brew",
  "Good stuff",
  "One way espresso",
  "Gusto Resto",
];

const supermarketKeywords = [
  "mart",
  "market",
  "supermarket",
  "grocery",
  "pepito",
  "fresh market",
  "minimarket",
  "ck",
  "circle k",
  "transmart",
  "sumber jaya",
  "nirmala",
  "ulu fish market",
  "bintang mart",
  "pepito express",
  "larissa",
  "Murni Teguh",
  "Tabanan",
  "Pepito Market Uluwatu",
];

const transfersKeywords = [
  "pb",
  "trf",
  "transfer",
  "payment",
  "bifast",
  "dari",
  "ke",
  "credit",
  "debit",
  "incoming",
  "outcoming",
  "valiakhm",
  "egorov",
  "grigoreva",
  "rachabova",
  "grigorev",
  "karymov",
  "zubkov",
  "novokshonov",
  "egorov",
  "krivosheeva",
  "Krisnawati",
  "Susanto",
  "Young",
  "Dewi",
  "elliiana",
  "Lintas Batas",
  "Rusmini",
  "elliiana",
  "Linar Valia",
  "byostrov",
  "Gonsaga",
  "Dmitrii",
  "Madina",
  "Kristina",
];

const billPaymentsKeywords = [
  "pay pln",
  "pln",
  "bill payment",
  "biaya adm",
  "admin fee",
  "pajak",
  "tax",
  "sms notifikasi",
  "gopay",
  "Netflix",
  "BPJamsostek",
];

const entertainmentKeywords = [
  "waterbom",
  "cinema",
  "xxi",
  "movie",
  "club",
  "hookah",
  "vaporizer",
  "vape",
  "chapter",
  "ticket",
  "massage",
  "spa",
  "beauty",
  "hair",
  "steamgames",
  "playstation",
  "agoda",
  "airbnb",
  "surf",
  "barber",
  "tattoo",
  "skating",
  "eska bar",
  "Waterbom Bali",
  "Eden Hookah",
  "Vape point",
  "Snow cat",
  "Asana Artseum",
  "Grab",
  "Trip",
  "Premiere",
  "deluxe",
];

const shoppingKeywords = [
  "shop",
  "store",
  "boutique",
  "uniqlo",
  "birkenstock",
  "whsmith",
  "ur mall",
  "gramedia",
  "shoppa roku",
  "ADI shop",
];

const tourismKeywords = [
  "beach",
  "hotel",
  "villa",
  "tour",
  "travel",
  "transport",
  "airport",
  "cruise",
  "sea",
  "scooter",
  "motor",
  "resort",
  "vacation",
  "surf villas",
  "beach club",
  "ADI Resto",
  "Super AirJet",
];

const accomodationsKeywords = ["Villa", "Homestay", "Guesthouse", "Resort", "Hotel",  "Nusa Dua", "Airbnb", "Booking", "Agoda", "Pool", "Bungalow", "Retreat", "Balinese style", "Ocean view"]

const groceriesKeywords = ["Minimart", "Pepito", "Bintang", "Circle K"]

const wellnessKeywords = ["Yoga", "Meditation", "Retreat", "Spa", "Massage", "Aromatherapy", "Jamu", "Herbal tea", "Detox", "Sound healing", "Reiki", "Wellness center", "Ubud Yoga Barn", "Radiantly Alive"]

const transportationKeywords = ["Scooter", "Motorbike", "Rental", "Gojek", "Grab", "Bluebird", "Driver", "Car hire", "Shuttle", "Airport transfer", "Taxi", "Surfboard rack", "Petrol", "Parking"]

const healthKeywords = ["Bambu Fitness", "Pharmacy", "Apotek", "Guardian", "Clinic", "Bali Med", "Siloam", "Doctor", "Dentist", "Hospital", "Vitamins", "Sunscreen", "Mosquito repellent", "Bali Rescue", "First aid"]

const beautyKeywords = ["Salon", "Manicure", "Pedicure", "Haircut", "Balinese hair spa", "Facial", "Waxing", "Threading", "Sensatia Botanicals", "Utama Spice", "Massage oil", "Body scrub", "Natural cosmetics"]

const educationKeywords = ["Cooking class", "Balinese dance", "Surf lesson", "Yoga teacher training", "Language course", "Bahasa Indonesia", "Art workshop", "Painting", "Carving", "Green School", "Ubud class"]

const homeKeywords = ["Furniture", "Teak", "Rattan", "Home decor", "Batik", "Bamboo", "Cleaning", "Laundry", "Warung laundry", "Kitchenware", "Coconut bowl", "Bali Zen", "Saya Gallery"]

const petsKeywords = ["Pet shop", "Vet", "Bali Pet Crusaders", "Dog food", "Cat food", "Treats", "Grooming", "Boarding", "Bali Dog", "Rescue", "Adoption", "Leash", "Collar", "Pet taxi"]

const eventsKeywords = ["Festival", "Bali Spirit", "Nyepi", "Concert", "Beach party", "Finns", "Dance performance", "Kecak", "Barong", "Wedding", "Ceremony", "Retreat", "Ticket", "Eventbrite", "Local event"]

const onlineKeywords = ["Tokopedia", "Shopee", "Lazada", "Netflix", "Spotify", "Zoom", "E-book", "Gojek app", "Grab app", "Internet", "SIM card", "Top-up"]

const utilitiesKeywords = ["Electricity", "PLN", "Prepaid token", "Water", "PDAM", "Bottled water", "Internet", "Telkomsel", "Biznet", "Gas", "LPG", "Refill", "Trash", "Maintenance", "Villa fee"]


const catKeywords: Record<Partial<typeof transactionCategories[number]>, string[]> = { 
  "Cafe/Restaurant": cafeRestaurantKeywords,
  "Supermarket/Products": supermarketKeywords,
  "Transfers/Payments": transfersKeywords,
  "Bills": billPaymentsKeywords,
  "Entertainment": entertainmentKeywords,
  "Shopping": shoppingKeywords,
  "Tourism": tourismKeywords,
  "Accommodations": accomodationsKeywords,
  "Groceries": groceriesKeywords,
  "Transportation": transportationKeywords,
    "Wellness": wellnessKeywords,
  "Health": healthKeywords,
  "Beauty": beautyKeywords,
  "Education": educationKeywords,
  "Home": homeKeywords,
  "Pets": petsKeywords,
  "Events": eventsKeywords,
  "Online": onlineKeywords,
  "Utilities": utilitiesKeywords,
}

export { transactionCategories, catKeywords }; 