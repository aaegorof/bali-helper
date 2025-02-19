const cafeRestaurantKeywords = [
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

const transactionCategories = [
  "Cafe/Restaurant",
  "Supermarket/Products",
  "Transfers/Payments",
  "Bills",
  "Entertainment",
  "Shopping",
  "Tourism",
];

function determineCategory(description) {
  if (!description) return "";

  const lowerDesc = description.toLowerCase();

  if (
    cafeRestaurantKeywords.some((keyword) =>
      lowerDesc.includes(keyword.toLowerCase())
    )
  ) {
    return "Cafe/Restaurant";
  }

  if (
    supermarketKeywords.some((keyword) =>
      lowerDesc.includes(keyword.toLowerCase())
    )
  ) {
    return "Supermarket/Products";
  }

  if (
    transfersKeywords.some((keyword) =>
      lowerDesc.includes(keyword.toLowerCase())
    )
  ) {
    return "Transfers/Payments";
  }

  if (
    billPaymentsKeywords.some((keyword) =>
      lowerDesc.includes(keyword.toLowerCase())
    )
  ) {
    return "Bills";
  }

  if (
    entertainmentKeywords.some((keyword) =>
      lowerDesc.includes(keyword.toLowerCase())
    )
  ) {
    return "Entertainment";
  }

  if (
    shoppingKeywords.some((keyword) =>
      lowerDesc.includes(keyword.toLowerCase())
    )
  ) {
    return "Shopping";
  }

  if (
    tourismKeywords.some((keyword) => lowerDesc.includes(keyword.toLowerCase()))
  ) {
    return "Tourism";
  }

  return "";
}

module.exports = {
  cafeRestaurantKeywords,
  supermarketKeywords,
  transfersKeywords,
  billPaymentsKeywords,
  entertainmentKeywords,
  shoppingKeywords,
  tourismKeywords,
  transactionCategories,
  determineCategory
};
