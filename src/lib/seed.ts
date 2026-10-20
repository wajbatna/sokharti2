import "server-only";
import { randomBytes } from "crypto";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import {
  addresses,
  banners,
  categories,
  coupons,
  drivers,
  media,
  menuSections,
  notifications,
  offers,
  orderEvents,
  orderItemExtras,
  orderItems,
  orders,
  payments,
  productExtras,
  products,
  reviews,
  settings,
  storeHours,
  stores,
  users,
} from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { toCents, orderCode } from "@/lib/utils";

const SEED_VERSION = "sakhrti-v1";

const px = (id: number, w = 900) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;

const FOOD = [6643655, 32524109, 6643712, 1653877, 19786212, 6643709, 5374419, 36374388, 28396820];
const PLACES = [34131386, 15208116, 3162057, 10168341, 37797927, 39504288, 32479112, 37751377];
const SHOPS = [6097885, 32418799, 5951182, 4437148, 4124939, 21582447, 6097892, 35285844];

const foodImg = (i: number) => px(FOOD[i % FOOD.length]);
const placeImg = (i: number) => px(PLACES[i % PLACES.length], 1200);
const shopImg = (i: number) => px(SHOPS[i % SHOPS.length]);

type CatSeed = {
  slug: string;
  name: string;
  nameFr: string;
  icon: string;
  kind: "restaurant" | "store";
  image: string;
};

const CATEGORIES: CatSeed[] = [
  { slug: "restaurants", name: "مطاعم", nameFr: "Restaurants", icon: "UtensilsCrossed", kind: "restaurant", image: foodImg(1) },
  { slug: "burger", name: "برغر", nameFr: "Burger", icon: "Beef", kind: "restaurant", image: foodImg(6) },
  { slug: "pizza", name: "بيتزا", nameFr: "Pizza", icon: "Pizza", kind: "restaurant", image: foodImg(3) },
  { slug: "tacos", name: "تاكوس", nameFr: "Tacos", icon: "Sandwich", kind: "restaurant", image: foodImg(0) },
  { slug: "chicken", name: "الدجاج", nameFr: "Poulet", icon: "Drumstick", kind: "restaurant", image: foodImg(4) },
  { slug: "sushi", name: "سوشي", nameFr: "Sushi", icon: "Fish", kind: "restaurant", image: foodImg(8) },
  { slug: "cafe", name: "مقاهي", nameFr: "Cafés", icon: "Coffee", kind: "restaurant", image: placeImg(0) },
  { slug: "desserts", name: "حلويات", nameFr: "Desserts", icon: "CakeSlice", kind: "restaurant", image: foodImg(2) },
  { slug: "moroccan", name: "مغربي", nameFr: "Marocain", icon: "ChefHat", kind: "restaurant", image: foodImg(5) },
  { slug: "grocery", name: "بقالة", nameFr: "Épicerie", icon: "ShoppingBasket", kind: "store", image: shopImg(2) },
  { slug: "pharmacy", name: "صيدليات", nameFr: "Pharmacies", icon: "Pill", kind: "store", image: shopImg(3) },
  { slug: "bakery", name: "مخابز", nameFr: "Boulangeries", icon: "Croissant", kind: "store", image: shopImg(0) },
  { slug: "beauty", name: "تجميل", nameFr: "Beauté", icon: "Sparkles", kind: "store", image: shopImg(7) },
  { slug: "electronics", name: "إلكترونيات", nameFr: "Électronique", icon: "Smartphone", kind: "store", image: shopImg(5) },
  { slug: "shops", name: "متاجر", nameFr: "Boutiques", icon: "Store", kind: "store", image: shopImg(4) },
];

type StoreSeed = {
  name: string;
  nameEn: string;
  cat: string;
  city: string;
  desc: string;
  fee: number;
  min: number;
  rating: number;
  reviews: number;
  min1: number;
  min2: number;
  dist: number;
  featured?: boolean;
  isNew?: boolean;
  free?: boolean;
  discount?: string;
  closed?: boolean;
  lat: number;
  lng: number;
};

const RESTAURANTS: StoreSeed[] = [
  { name: "برغر بوس", nameEn: "Burger Boss", cat: "burger", city: "برشيد", desc: "برغر طازج مشوي على الفحم مع صوصات البيت وخبز بريوش.", fee: 10, min: 50, rating: 4.8, reviews: 1240, min1: 25, min2: 35, dist: 1.2, featured: true, discount: "-20%", lat: 33.2677, lng: -7.5869 },
  { name: "بيتزا روما", nameEn: "Pizza Roma", cat: "pizza", city: "برشيد", desc: "بيتزا إيطالية بعجين ٤٨ ساعة وفرن حجري.", fee: 12, min: 60, rating: 4.7, reviews: 980, min1: 30, min2: 45, dist: 2.1, featured: true, free: true, lat: 33.2701, lng: -7.5901 },
  { name: "تاكوس سيتي", nameEn: "Tacos City", cat: "tacos", city: "برشيد", desc: "تاكوس مغربي أصيل بصوص الجبن الخاص.", fee: 8, min: 40, rating: 4.6, reviews: 2310, min1: 20, min2: 30, dist: 0.9, discount: "-15%", lat: 33.2649, lng: -7.5822 },
  { name: "شاورما بيروت", nameEn: "Shawarma Beirut", cat: "restaurants", city: "برشيد", desc: "شاورما لبنانية، دجاج ولحم مع خبز صاج.", fee: 10, min: 45, rating: 4.5, reviews: 760, min1: 25, min2: 40, dist: 1.8, lat: 33.2688, lng: -7.5793 },
  { name: "دجاج الأصيل", nameEn: "Chicken Grill", cat: "chicken", city: "برشيد", desc: "دجاج مشوي وبروستد بتوابل مغربية.", fee: 9, min: 50, rating: 4.4, reviews: 540, min1: 30, min2: 45, dist: 2.6, lat: 33.2732, lng: -7.5848 },
  { name: "سوشي كازا", nameEn: "Sushi Casa", cat: "sushi", city: "الدار البيضاء", desc: "سوشي طازج يومياً وسلمون نرويجي.", fee: 15, min: 120, rating: 4.9, reviews: 410, min1: 35, min2: 50, dist: 4.2, featured: true, lat: 33.5731, lng: -7.5898 },
  { name: "مشاوي الأطلس", nameEn: "Atlas Grill", cat: "moroccan", city: "برشيد", desc: "مشاوي، كفتة، ومرگاز على الجمر.", fee: 10, min: 70, rating: 4.6, reviews: 690, min1: 30, min2: 45, dist: 3.1, lat: 33.2612, lng: -7.5911 },
  { name: "كافي لاكروازيت", nameEn: "Café La Croisette", cat: "cafe", city: "برشيد", desc: "قهوة مختصة، فطور كامل وحلويات.", fee: 7, min: 30, rating: 4.7, reviews: 1520, min1: 15, min2: 25, dist: 0.6, free: true, lat: 33.2664, lng: -7.5877 },
  { name: "حلويات الفردوس", nameEn: "Firdaws Sweets", cat: "desserts", city: "برشيد", desc: "كعب غزال، شباكية وحلويات عصرية.", fee: 8, min: 40, rating: 4.8, reviews: 430, min1: 25, min2: 40, dist: 1.5, discount: "-10%", lat: 33.2705, lng: -7.5835 },
  { name: "دار زمان", nameEn: "Dar Zman", cat: "moroccan", city: "برشيد", desc: "بسطيلة، طاجين وكسكس بيتي.", fee: 12, min: 80, rating: 4.9, reviews: 320, min1: 40, min2: 60, dist: 2.9, featured: true, lat: 33.2591, lng: -7.5784 },
  { name: "طاجين البركة", nameEn: "Tajine Al Baraka", cat: "moroccan", city: "سطات", desc: "طاجين مغربي على الطريقة التقليدية.", fee: 14, min: 60, rating: 4.3, reviews: 210, min1: 35, min2: 55, dist: 5.4, isNew: true, lat: 33.0011, lng: -7.6166 },
  { name: "سناك الشاطئ", nameEn: "Snack Plage", cat: "restaurants", city: "المحمدية", desc: "سندويتشات، أسماك مقلية وسلطات.", fee: 11, min: 45, rating: 4.2, reviews: 180, min1: 30, min2: 45, dist: 6.1, lat: 33.6861, lng: -7.383 },
  { name: "برغر هاوس", nameEn: "Burger House", cat: "burger", city: "الدار البيضاء", desc: "سمash برغر أمريكي وبطاطس محلية.", fee: 13, min: 60, rating: 4.5, reviews: 870, min1: 30, min2: 45, dist: 4.8, discount: "-25%", lat: 33.5892, lng: -7.6031 },
  { name: "بيتزا نابولي", nameEn: "Pizza Napoli", cat: "pizza", city: "سطات", desc: "بيتزا رقيقة بالموزاريلا الطازجة.", fee: 12, min: 55, rating: 4.4, reviews: 350, min1: 30, min2: 50, dist: 5.9, isNew: true, lat: 33.0033, lng: -7.6201 },
  { name: "كريب آند وافل", nameEn: "Crêpe & Waffle", cat: "desserts", city: "برشيد", desc: "كريب، وافل وميلك شيك.", fee: 8, min: 35, rating: 4.6, reviews: 640, min1: 20, min2: 35, dist: 1.1, free: true, lat: 33.2671, lng: -7.5915 },
  { name: "مطعم الحرشة", nameEn: "Harcha House", cat: "moroccan", city: "برشيد", desc: "فطور مغربي: حرشة، مسمن وبغرير.", fee: 7, min: 30, rating: 4.5, reviews: 520, min1: 15, min2: 30, dist: 0.8, lat: 33.2658, lng: -7.5861 },
  { name: "جوس آند سموذي", nameEn: "Juice & Smoothie", cat: "cafe", city: "برشيد", desc: "عصائر طبيعية 100% بدون سكر مضاف.", fee: 6, min: 25, rating: 4.7, reviews: 910, min1: 15, min2: 25, dist: 1.0, discount: "-10%", lat: 33.2683, lng: -7.5889 },
  { name: "فطائر المدينة", nameEn: "Medina Pastry", cat: "restaurants", city: "برشيد", desc: "فطائر وميني بيتزا ومعجنات ساخنة.", fee: 9, min: 40, rating: 4.3, reviews: 280, min1: 25, min2: 40, dist: 2.2, lat: 33.2715, lng: -7.5802 },
  { name: "رويال فرايد تشيكن", nameEn: "Royal Fried Chicken", cat: "chicken", city: "الدار البيضاء", desc: "دجاج مقرمش بوصفة سرية وصوص حار.", fee: 13, min: 55, rating: 4.4, reviews: 1130, min1: 30, min2: 45, dist: 4.5, discount: "-30%", lat: 33.5801, lng: -7.6212 },
  { name: "فريش بول", nameEn: "Fresh Bowl", cat: "restaurants", city: "برشيد", desc: "سلطات وبولات صحية وبروتين مشوي.", fee: 10, min: 50, rating: 4.6, reviews: 240, min1: 25, min2: 40, dist: 1.7, isNew: true, lat: 33.2699, lng: -7.5846 },
  { name: "كباب إسطنبول", nameEn: "Istanbul Kebab", cat: "restaurants", city: "برشيد", desc: "كباب تركي، إسكندر ولحم عجل.", fee: 11, min: 60, rating: 4.5, reviews: 470, min1: 30, min2: 45, dist: 2.4, lat: 33.2641, lng: -7.5931 },
  { name: "مطعم البحر الأبيض", nameEn: "Mediterraneo", cat: "restaurants", city: "الجديدة", desc: "أسماك طازجة ومأكولات بحرية.", fee: 16, min: 90, rating: 4.7, reviews: 390, min1: 40, min2: 60, dist: 7.3, closed: true, lat: 33.2316, lng: -8.5007 },
];

const SHOPS_SEED: StoreSeed[] = [
  { name: "بقالة الوفاء", nameEn: "Al Wafa Market", cat: "grocery", city: "برشيد", desc: "كلشي ديال الدار: مواد غذائية ومنظفات.", fee: 9, min: 60, rating: 4.5, reviews: 620, min1: 25, min2: 40, dist: 1.0, featured: true, lat: 33.2668, lng: -7.5858 },
  { name: "صيدلية النور", nameEn: "Pharmacie Ennour", cat: "pharmacy", city: "برشيد", desc: "أدوية ومستلزمات طبية على مدار اليوم.", fee: 8, min: 30, rating: 4.8, reviews: 310, min1: 20, min2: 30, dist: 0.7, lat: 33.2675, lng: -7.5883 },
  { name: "مخبزة الرحمة", nameEn: "Boulangerie Rahma", cat: "bakery", city: "برشيد", desc: "خبز طازج، مسمن وحلويات صباحية.", fee: 6, min: 20, rating: 4.6, reviews: 880, min1: 15, min2: 25, dist: 0.5, free: true, lat: 33.2662, lng: -7.5871 },
  { name: "سوبر ماركت أطلس", nameEn: "Atlas Supermarket", cat: "grocery", city: "برشيد", desc: "تسوق كامل مع توصيل سريع.", fee: 12, min: 100, rating: 4.4, reviews: 450, min1: 35, min2: 55, dist: 2.8, discount: "-15%", lat: 33.2723, lng: -7.5814 },
  { name: "دار السكر", nameEn: "Sugar House", cat: "bakery", city: "برشيد", desc: "حلويات مغربية وكيك مناسبات.", fee: 10, min: 50, rating: 4.7, reviews: 290, min1: 30, min2: 45, dist: 1.9, lat: 33.2691, lng: -7.5927 },
  { name: "ديجيتال ستور", nameEn: "Digital Store", cat: "electronics", city: "الدار البيضاء", desc: "إكسسوارات الهاتف، سماعات وشواحن.", fee: 15, min: 150, rating: 4.3, reviews: 160, min1: 45, min2: 70, dist: 5.2, isNew: true, lat: 33.5866, lng: -7.6114 },
  { name: "بيوتي سنتر", nameEn: "Beauty Center", cat: "beauty", city: "برشيد", desc: "مستحضرات تجميل وعناية بالبشرة.", fee: 11, min: 80, rating: 4.6, reviews: 220, min1: 30, min2: 50, dist: 2.3, discount: "-20%", lat: 33.2707, lng: -7.5857 },
  { name: "خضر وفواكه البلدي", nameEn: "Baladi Fresh", cat: "grocery", city: "برشيد", desc: "خضر وفواكه طازجة من السوق يومياً.", fee: 7, min: 40, rating: 4.5, reviews: 540, min1: 20, min2: 35, dist: 1.3, free: true, lat: 33.2655, lng: -7.5899 },
  { name: "مكتبة القلم", nameEn: "Al Qalam Library", cat: "shops", city: "برشيد", desc: "أدوات مدرسية ومكتبية وكتب.", fee: 10, min: 50, rating: 4.2, reviews: 130, min1: 30, min2: 50, dist: 2.0, lat: 33.2686, lng: -7.5806 },
  { name: "صيدلية الشفاء", nameEn: "Pharmacie Chifa", cat: "pharmacy", city: "سطات", desc: "خدمة صيدلية الحراسة والتوصيل.", fee: 12, min: 30, rating: 4.7, reviews: 190, min1: 25, min2: 45, dist: 5.6, lat: 33.0021, lng: -7.6188 },
  { name: "لحوم الأمانة", nameEn: "Al Amana Butcher", cat: "shops", city: "برشيد", desc: "لحوم حمراء وبيضاء طازجة يومياً.", fee: 10, min: 80, rating: 4.4, reviews: 210, min1: 30, min2: 45, dist: 1.6, lat: 33.2712, lng: -7.5877 },
  { name: "بيت الحيوانات", nameEn: "Pet House", cat: "shops", city: "برشيد", desc: "أكل ومستلزمات الحيوانات الأليفة.", fee: 12, min: 60, rating: 4.1, reviews: 90, min1: 35, min2: 55, dist: 3.4, isNew: true, closed: true, lat: 33.2634, lng: -7.5952 },
];

type Item = { name: string; desc: string; price: number; old?: number; popular?: boolean };

const MENUS: Record<string, Item[]> = {
  burger: [
    { name: "تشيز برغر", desc: "لحم بقري ١٥٠غ، شيدر، طماطم، خس وصوص البيت", price: 39, old: 49, popular: true },
    { name: "دوبل برغر", desc: "قطعتان لحم، جبن مزدوج وبصل مكرمل", price: 59, popular: true },
    { name: "برغر دجاج مقرمش", desc: "صدر دجاج مقرمش مع صوص الثوم", price: 42 },
    { name: "منيو برغر كامل", desc: "برغر + بطاطس + مشروب", price: 69, old: 79, popular: true },
    { name: "بطاطس شيدر", desc: "بطاطس مقلية مع صوص الشيدر الساخن", price: 25 },
    { name: "أونيون رينغز", desc: "حلقات بصل مقرمشة ٨ قطع", price: 22 },
  ],
  pizza: [
    { name: "بيتزا مارغريتا", desc: "صلصة طماطم، موزاريلا وريحان طازج", price: 55, popular: true },
    { name: "بيتزا بيبروني", desc: "بيبروني حار مع جبن مشكل", price: 69, old: 85, popular: true },
    { name: "بيتزا أربع أجبان", desc: "موزاريلا، شيدر، جودة وبارميزان", price: 75 },
    { name: "بيتزا دجاج باربكيو", desc: "دجاج مشوي وصوص الباربكيو", price: 72 },
    { name: "كالزوني", desc: "عجين محشو بالجبن واللحم", price: 58 },
    { name: "تيراميسو", desc: "حلوى إيطالية بالمسكربوني", price: 32 },
  ],
  tacos: [
    { name: "تاكوس M", desc: "دجاج أو كفتة + بطاطس + صوص الجبن", price: 32, popular: true },
    { name: "تاكوس L", desc: "لحمين مع صوص الألجيري", price: 45, old: 52, popular: true },
    { name: "تاكوس XL ميكست", desc: "ثلاث أنواع لحم وصوص خاص", price: 58 },
    { name: "بانيني دجاج", desc: "بانيني ساخن بالجبن والدجاج", price: 30 },
    { name: "بطاطس كبيرة", desc: "بطاطس مقلية مع الكاتشب", price: 18 },
  ],
  chicken: [
    { name: "دجاج مشوي كامل", desc: "دجاج بلدي متبل مع بطاطس", price: 79, popular: true },
    { name: "بروستد ٦ قطع", desc: "دجاج مقرمش مع خبز وصوص", price: 65, old: 79, popular: true },
    { name: "وينغز حارة ٨ قطع", desc: "أجنحة بصوص بافالو", price: 45 },
    { name: "ساندويتش تندرز", desc: "شرائح دجاج مقرمشة مع الخس", price: 38 },
    { name: "كول سلو", desc: "سلطة ملفوف كريمية", price: 15 },
  ],
  sushi: [
    { name: "سلمون رول ٨ قطع", desc: "سلمون طازج، أفوكادو وأرز سوشي", price: 95, popular: true },
    { name: "كاليفورنيا رول", desc: "سurimi، خيار وأفوكادو", price: 78 },
    { name: "ساشيمي سلمون", desc: "٦ شرائح سلمون نرويجي", price: 110, old: 130 },
    { name: "بوكي بول", desc: "أرز، سلمون، إيدامامي ومانغو", price: 89, popular: true },
    { name: "ميسو سوب", desc: "شوربة ميسو تقليدية", price: 28 },
  ],
  cafe: [
    { name: "قهوة إسبريسو", desc: "حبوب مختصة محمصة محلياً", price: 14, popular: true },
    { name: "كابتشينو", desc: "إسبريسو مع رغوة حليب", price: 20, popular: true },
    { name: "لاتيه بالكراميل", desc: "قهوة مع حليب وكراميل", price: 26 },
    { name: "فطور كامل", desc: "مشروب + عصير + مسمن + بيض", price: 45, old: 55 },
    { name: "عصير برتقال طازج", desc: "٥٠ سل عصير طبيعي", price: 18 },
    { name: "ميلك شيك أوريو", desc: "حليب، آيس كريم وأوريو", price: 32 },
  ],
  desserts: [
    { name: "كعب غزال", desc: "١٢ قطعة باللوز الطبيعي", price: 65, popular: true },
    { name: "شباكية", desc: "٥٠٠غ بالعسل والسمسم", price: 45 },
    { name: "تشيز كيك فراولة", desc: "قطعة كبيرة بالفراولة الطازجة", price: 35, old: 42, popular: true },
    { name: "كريب نوتيلا", desc: "كريب ساخن مع نوتيلا وموز", price: 30 },
    { name: "وافل بلجيكي", desc: "وافل مع آيس كريم فانيلا", price: 34 },
  ],
  moroccan: [
    { name: "طاجين لحم بالبرقوق", desc: "لحم بقري طري مع البرقوق واللوز", price: 85, popular: true },
    { name: "بسطيلة دجاج", desc: "بسطيلة تقليدية باللوز والقرفة", price: 70, old: 85, popular: true },
    { name: "كسكس بسبع خضار", desc: "كسكس بلدي يوم الجمعة", price: 75 },
    { name: "حريرة مغربية", desc: "طبق حريرة ساخنة مع التمر", price: 18 },
    { name: "مسمن بالعسل", desc: "٣ قطع مسمن طازج", price: 20 },
    { name: "شاي بالنعناع", desc: "براد شاي مغربي أصيل", price: 15 },
  ],
  restaurants: [
    { name: "شاورما دجاج", desc: "خبز صاج، دجاج متبل وصوص الثوم", price: 35, popular: true },
    { name: "شاورما لحم", desc: "لحم شاورما مع طحينة وبقدونس", price: 42, old: 50 },
    { name: "طبق مشاوي مشكل", desc: "كفتة، دجاج، مرگاز مع الأرز", price: 89, popular: true },
    { name: "سلطة فتوش", desc: "خضار طازجة مع خبز محمص", price: 28 },
    { name: "حمص بالطحينة", desc: "طبق حمص مع زيت الزيتون", price: 22 },
    { name: "مشروب غازي", desc: "علبة ٣٣ سل", price: 10 },
  ],
  grocery: [
    { name: "حليب نصف دسم ١ل", desc: "حليب طازج مبستر", price: 8, popular: true },
    { name: "زيت الزيتون البلدي ١ل", desc: "عصرة أولى على البارد", price: 95, old: 110, popular: true },
    { name: "أرز بسمتي ٥ كلغ", desc: "أرز هندي طويل الحبة", price: 89 },
    { name: "سكر مقنن ٢ كلغ", desc: "سكر أبيض", price: 24 },
    { name: "بيض بلدي ٣٠ وحدة", desc: "بيض طازج من المزرعة", price: 45 },
    { name: "منظف متعدد الاستعمالات", desc: "٢ لتر برائحة الليمون", price: 32 },
  ],
  pharmacy: [
    { name: "باراسيتامول ١غ", desc: "علبة ٨ أقراص لخفض الحرارة", price: 18, popular: true },
    { name: "فيتامين سي ١٠٠٠", desc: "٢٠ قرص فوار", price: 65 },
    { name: "كمامات طبية ٥٠", desc: "علبة كمامات ٣ طبقات", price: 35 },
    { name: "مطهر لليدين ٥٠٠مل", desc: "جل كحولي ٧٠%", price: 42, old: 55 },
    { name: "كريم واقي شمس SPF50", desc: "حماية عالية للبشرة", price: 130, popular: true },
  ],
  bakery: [
    { name: "خبز بلدي طازج", desc: "٤ أرغفة من فرن الحطب", price: 8, popular: true },
    { name: "مسمن ٥ قطع", desc: "مسمن مغربي تقليدي", price: 20, popular: true },
    { name: "كرواسون بالزبدة", desc: "٤ قطع كرواسون فرنسي", price: 28 },
    { name: "كيك مناسبات ١ كلغ", desc: "كيك بالشوكولاتة حسب الطلب", price: 180, old: 220 },
    { name: "بغرير", desc: "٦ قطع بغرير بالعسل", price: 25 },
  ],
  beauty: [
    { name: "غسول وجه بالفحم", desc: "٢٠٠ مل ينظف البشرة بعمق", price: 79, popular: true },
    { name: "زيت الأركان الأصلي", desc: "١٠٠ مل أركان تجميلي", price: 120, old: 150, popular: true },
    { name: "أحمر شفاه مات", desc: "ثبات ١٢ ساعة", price: 89 },
    { name: "شامبو للشعر الجاف", desc: "٤٠٠ مل بالكيراتين", price: 65 },
    { name: "كريم ترطيب اليدين", desc: "١٠٠ مل بالشيا", price: 45 },
  ],
  electronics: [
    { name: "سماعات بلوتوث TWS", desc: "بطارية ٢٤ ساعة مع علبة شحن", price: 249, old: 320, popular: true },
    { name: "شاحن سريع 20W", desc: "شاحن USB-C أصلي", price: 129 },
    { name: "باور بانك ١٠٠٠٠", desc: "شحن سريع لجهازين", price: 199, popular: true },
    { name: "كابل USB-C ٢م", desc: "كابل مضفر متين", price: 59 },
    { name: "حامل هاتف للسيارة", desc: "تثبيت مغناطيسي", price: 79 },
  ],
  shops: [
    { name: "حقيبة مدرسية", desc: "حقيبة متينة بعجلات", price: 189, old: 230, popular: true },
    { name: "دفاتر ٩٦ ورقة ×٥", desc: "حزمة دفاتر مدرسية", price: 45 },
    { name: "أقلام جافة ١٠ وحدات", desc: "أزرق وأسود", price: 25 },
    { name: "كيس أكل قطط ٢ كلغ", desc: "تغذية متوازنة", price: 95, popular: true },
    { name: "لحم بقري طازج ١ كلغ", desc: "لحم بلدي مقطع حسب الطلب", price: 110 },
  ],
};

const EXTRAS: Record<string, { name: string; price: number }[]> = {
  burger: [
    { name: "جبن إضافي", price: 5 },
    { name: "لحم مزدوج", price: 15 },
    { name: "صوص إضافي", price: 3 },
    { name: "بيكون", price: 8 },
  ],
  pizza: [
    { name: "جبن إضافي", price: 10 },
    { name: "زيتون", price: 5 },
    { name: "فطر", price: 7 },
  ],
  tacos: [
    { name: "صوص الجبن", price: 5 },
    { name: "لحم إضافي", price: 12 },
    { name: "حار", price: 0 },
  ],
  default: [
    { name: "كمية إضافية", price: 10 },
    { name: "تغليف هدية", price: 8 },
  ],
};

function hoursFor(storeId: number) {
  return Array.from({ length: 7 }, (_, day) => ({
    storeId,
    dayOfWeek: day,
    openTime: day === 5 ? "12:00" : "09:00",
    closeTime: day === 5 ? "23:59" : "23:30",
    isClosed: false,
  }));
}

async function isSeeded() {
  const rows = await db
    .select()
    .from(settings)
    .where(sql`${settings.key} = 'seed_version'`)
    .limit(1);
  return rows.length > 0 && (rows[0].value as { version?: string }).version === SEED_VERSION;
}

export async function runSeed() {
  // Clean slate (idempotent re-seed)
  await db.execute(sql`TRUNCATE TABLE
    ${orderItemExtras}, ${orderItems}, ${orderEvents}, ${payments}, ${orders},
    ${productExtras}, ${products}, ${menuSections}, ${storeHours}, ${offers},
    ${reviews}, ${banners}, ${coupons}, ${notifications}, ${addresses},
    ${drivers}, ${media}, ${categories}, ${stores}, ${users}
    RESTART IDENTITY CASCADE`);

  const demoPassword = process.env.DEMO_PASSWORD || `Skh${randomBytes(4).toString("hex")}!2026`;
  const adminPassword = process.env.ADMIN_PASSWORD || demoPassword;
  const hash = await hashPassword(demoPassword);
  const adminHash = process.env.ADMIN_PASSWORD ? await hashPassword(adminPassword) : hash;

  const [admin] = await db
    .insert(users)
    .values({
      name: "إدارة سخرتي",
      email: process.env.ADMIN_EMAIL || "admin@sakhrti.ma",
      phone: "0600000000",
      passwordHash: adminHash,
      role: "admin",
      city: "برشيد",
    })
    .returning();

  const [customer] = await db
    .insert(users)
    .values({ name: "يوسف العلمي", email: "client@sakhrti.ma", phone: "0612345678", passwordHash: hash, role: "customer", city: "برشيد" })
    .returning();

  const [driverUser] = await db
    .insert(users)
    .values({ name: "رشيد السائق", email: "driver@sakhrti.ma", phone: "0655667788", passwordHash: hash, role: "driver", city: "برشيد" })
    .returning();

  const catRows = await db
    .insert(categories)
    .values(
      CATEGORIES.map((c, i) => ({
        slug: c.slug,
        name: c.name,
        nameFr: c.nameFr,
        icon: c.icon,
        imageUrl: c.image,
        kind: c.kind,
        sortOrder: i,
        isActive: true,
      })),
    )
    .returning();
  const catBySlug = new Map(catRows.map((c) => [c.slug, c]));

  const allSeeds = [
    ...RESTAURANTS.map((s) => ({ ...s, kind: "restaurant" as const })),
    ...SHOPS_SEED.map((s) => ({ ...s, kind: "store" as const })),
  ];

  // vendor account owns the first restaurant
  const [vendor] = await db
    .insert(users)
    .values({ name: "سعيد صاحب برغر بوس", email: "vendor@sakhrti.ma", phone: "0622334455", passwordHash: hash, role: "vendor", city: "برشيد" })
    .returning();

  const storeRows = await db
    .insert(stores)
    .values(
      allSeeds.map((s, i) => ({
        slug: `${s.nameEn.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
        name: s.name,
        nameEn: s.nameEn,
        description: s.desc,
        logoUrl: s.kind === "restaurant" ? foodImg(i + 2) : shopImg(i + 1),
        coverUrl: s.kind === "restaurant" ? placeImg(i) : shopImg(i),
        phone: `05${22 + (i % 7)}${String(100000 + i * 137).slice(0, 6)}`,
        address: `شارع محمد الخامس، رقم ${12 + i}`,
        city: s.city,
        lat: s.lat,
        lng: s.lng,
        categoryId: catBySlug.get(s.cat)?.id ?? null,
        kind: s.kind,
        ownerId: i === 0 ? vendor.id : null,
        deliveryFee: toCents(s.free ? 0 : s.fee),
        minOrder: toCents(s.min),
        deliveryMinMinutes: s.min1,
        deliveryMaxMinutes: s.min2,
        distanceKm: s.dist,
        rating: s.rating,
        reviewCount: s.reviews,
        orderCount: 120 + i * 37,
        commissionRate: 10 + (i % 3) * 2.5,
        status: "approved" as const,
        isOpen: !s.closed,
        isFeatured: Boolean(s.featured),
        isNew: Boolean(s.isNew),
        freeDelivery: Boolean(s.free),
        discountLabel: s.discount ?? null,
      })),
    )
    .returning();

  // hours
  await db.insert(storeHours).values(storeRows.flatMap((s) => hoursFor(s.id)));

  // menu sections + products
  let imgCursor = 0;
  for (const [index, store] of storeRows.entries()) {
    const seed = allSeeds[index];
    const sectionNames =
      store.kind === "restaurant"
        ? ["الأكثر طلباً", "الأطباق الرئيسية", "المشروبات والحلويات"]
        : ["الأكثر مبيعاً", "عروض الأسبوع", "أساسيات البيت"];
    const sections = await db
      .insert(menuSections)
      .values(sectionNames.map((name, i) => ({ storeId: store.id, name, sortOrder: i })))
      .returning();

    const items = MENUS[seed.cat] ?? MENUS.restaurants;
    const productValues = items.map((item, i) => {
      imgCursor += 1;
      return {
        storeId: store.id,
        sectionId: sections[i % sections.length].id,
        name: item.name,
        description: item.desc,
        imageUrl: store.kind === "restaurant" ? foodImg(imgCursor) : shopImg(imgCursor),
        price: toCents(item.price),
        oldPrice: item.old ? toCents(item.old) : null,
        discountPercent: item.old ? Math.round(((item.old - item.price) / item.old) * 100) : 0,
        isPopular: Boolean(item.popular),
        isAvailable: true,
        stock: 40 + i * 7,
        sortOrder: i,
      };
    });
    const createdProducts = await db.insert(products).values(productValues).returning();

    const extras = EXTRAS[seed.cat] ?? EXTRAS.default;
    await db.insert(productExtras).values(
      createdProducts.flatMap((p) =>
        extras.map((e) => ({ productId: p.id, name: e.name, price: toCents(e.price), isActive: true })),
      ),
    );

    // offers for discounted stores
    if (seed.discount) {
      const target = createdProducts.find((p) => p.oldPrice) ?? createdProducts[0];
      await db.insert(offers).values({
        storeId: store.id,
        productId: target.id,
        title: `${seed.discount} على ${target.name}`,
        subtitle: `عرض خاص من ${store.name}`,
        imageUrl: target.imageUrl,
        discountPercent: Math.abs(parseInt(seed.discount.replace(/[^0-9]/g, ""), 10)) || 20,
        oldPrice: target.oldPrice ?? Math.round(target.price * 1.25),
        newPrice: target.price,
        endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
        isActive: true,
      });
    }

    // reviews
    const comments = [
      "خدمة ممتازة والتوصيل جا بزربة 👌",
      "الماكلة سخونة ولذيذة، غادي نعاود الطلب.",
      "جودة راقية والتغليف نظيف.",
      "الأسعار مناسبة والطعم زوين.",
      "توصيل في الوقت المحدد، شكراً سخرتي.",
    ];
    await db.insert(reviews).values(
      Array.from({ length: 3 }, (_, i) => ({
        userId: customer.id,
        storeId: store.id,
        authorName: ["سارة ب.", "محمد ع.", "ليلى م.", "كريم ح."][(index + i) % 4],
        rating: 4 + ((index + i) % 2),
        deliveryRating: 4 + ((index + i + 1) % 2),
        productRating: 5,
        comment: comments[(index + i) % comments.length],
        status: (i === 2 && index % 6 === 0 ? "pending" : "approved") as "pending" | "approved",
      })),
    );
  }

  // banners
  await db.insert(banners).values([
    {
      title: "خصم حتى 30% على أول طلب",
      subtitle: "استعمل الكود SAKHRTI30 ودير طلبك دابا",
      imageUrl: "/banners/banner-offers.jpg",
      buttonLabel: "شوف العروض",
      link: "/offers",
      theme: "orange",
      sortOrder: 0,
    },
    {
      title: "توصيل مجاني هاد الأسبوع",
      subtitle: "على جميع الطلبات فوق 80 د.م",
      imageUrl: "/banners/banner-delivery.jpg",
      buttonLabel: "اطلب دابا",
      link: "/restaurants",
      theme: "dark",
      sortOrder: 1,
    },
    {
      title: "البقالة حتى لباب دارك",
      subtitle: "كلشي لي محتاج من السوق فأقل من 30 دقيقة",
      imageUrl: "/banners/banner-grocery.jpg",
      buttonLabel: "تسوق دابا",
      link: "/stores",
      theme: "green",
      sortOrder: 2,
    },
  ]);

  // coupons
  await db.insert(coupons).values([
    { code: "SAKHRTI30", description: "خصم 30% على أول طلب", type: "percent", value: 30, minOrder: toCents(60), maxDiscount: toCents(40), usageLimit: 5000, perUserLimit: 1, isActive: true },
    { code: "FREEDELIV", description: "توصيل مجاني", type: "free_delivery", value: 0, minOrder: toCents(80), usageLimit: 2000, perUserLimit: 5, isActive: true },
    { code: "WELCOME20", description: "20 درهم تخفيض", type: "fixed", value: toCents(20), minOrder: toCents(70), usageLimit: 1000, perUserLimit: 2, isActive: true },
    { code: "BURGER15", description: "15% على برغر بوس", type: "percent", value: 15, minOrder: toCents(50), maxDiscount: toCents(30), storeId: storeRows[0].id, usageLimit: 300, perUserLimit: 3, isActive: true },
    { code: "RAMADAN25", description: "25% على الحلويات", type: "percent", value: 25, minOrder: toCents(100), maxDiscount: toCents(50), usageLimit: 500, perUserLimit: 1, isActive: false },
  ]);

  // drivers
  const driverRows = await db
    .insert(drivers)
    .values([
      { userId: driverUser.id, name: "رشيد المهدي", phone: "0655667788", vehicle: "دراجة نارية", status: "available", rating: 4.9, deliveriesCount: 842, earnings: toCents(12450), lat: 33.2672, lng: -7.5865 },
      { name: "يونس الغزاوي", phone: "0661223344", vehicle: "سكوتر كهربائي", status: "busy", rating: 4.7, deliveriesCount: 512, earnings: toCents(8300), lat: 33.2701, lng: -7.5832 },
      { name: "عبد الله بنعلي", phone: "0677889900", vehicle: "دراجة نارية", status: "available", rating: 4.8, deliveriesCount: 631, earnings: toCents(9800), lat: 33.2638, lng: -7.5901 },
      { name: "حمزة الإدريسي", phone: "0699887766", vehicle: "سيارة", status: "offline", rating: 4.5, deliveriesCount: 233, earnings: toCents(4100), lat: 33.2755, lng: -7.5788 },
    ])
    .returning();

  // addresses
  await db.insert(addresses).values([
    { userId: customer.id, label: "home", city: "برشيد", street: "حي النهضة، زنقة 12، رقم 34", details: "الطابق الثاني", notes: "الجرس على اليمين", lat: 33.2665, lng: -7.5872, isDefault: true },
    { userId: customer.id, label: "work", city: "برشيد", street: "المنطقة الصناعية، شارع الحسن الثاني", details: "مكتب 4", lat: 33.2721, lng: -7.5801, isDefault: false },
  ]);

  // sample orders
  const statuses = ["delivered", "delivered", "on_the_way", "preparing", "received", "cancelled", "delivered", "confirmed"] as const;
  for (const [i, status] of statuses.entries()) {
    const store = storeRows[i % storeRows.length];
    const storeProducts = await db
      .select()
      .from(products)
      .where(sql`${products.storeId} = ${store.id}`)
      .limit(3);
    const chosen = storeProducts.slice(0, 1 + (i % 3));
    const subtotal = chosen.reduce((sum, p) => sum + p.price * (1 + (i % 2)), 0);
    const deliveryFee = store.deliveryFee;
    const serviceFee = 300;
    const discount = i % 3 === 0 ? toCents(15) : 0;
    const total = subtotal + deliveryFee + serviceFee - discount;
    const commission = Math.round((subtotal * store.commissionRate) / 100);
    const created = new Date(Date.now() - 1000 * 60 * 60 * (6 + i * 19));

    const [order] = await db
      .insert(orders)
      .values({
        code: orderCode(),
        userId: customer.id,
        storeId: store.id,
        driverId: ["on_the_way", "picked_up", "delivered"].includes(status) ? driverRows[i % 3].id : null,
        status,
        subtotal,
        deliveryFee,
        serviceFee,
        discount,
        total,
        commission,
        vendorEarnings: subtotal - commission,
        platformRevenue: commission + serviceFee,
        paymentMethod: i % 3 === 0 ? "card" : "cash",
        paymentStatus: status === "delivered" ? "paid" : "pending",
        contactName: customer.name,
        phone: customer.phone ?? "0612345678",
        addressLabel: "home",
        addressText: "حي النهضة، زنقة 12، رقم 34، برشيد",
        lat: 33.2665,
        lng: -7.5872,
        notes: i % 2 === 0 ? "بلا بصلة عافاك" : null,
        couponCode: discount ? "WELCOME20" : null,
        etaMinutes: store.deliveryMaxMinutes,
        createdAt: created,
        updatedAt: created,
      })
      .returning();

    for (const p of chosen) {
      const qty = 1 + (i % 2);
      const [item] = await db
        .insert(orderItems)
        .values({
          orderId: order.id,
          productId: p.id,
          name: p.name,
          imageUrl: p.imageUrl,
          unitPrice: p.price,
          quantity: qty,
          notes: null,
          lineTotal: p.price * qty,
        })
        .returning();
      if (i % 2 === 0) {
        await db.insert(orderItemExtras).values({ orderItemId: item.id, name: "جبن إضافي", price: toCents(5) });
      }
    }

    const flow = ["received", "confirmed", "preparing", "ready", "picked_up", "on_the_way", "delivered"];
    const upto = status === "cancelled" ? 2 : flow.indexOf(status) + 1;
    await db.insert(orderEvents).values(
      flow.slice(0, Math.max(1, upto)).map((s, idx) => ({
        orderId: order.id,
        status: s as (typeof flow)[number] as "received",
        message: null,
        createdAt: new Date(created.getTime() + idx * 6 * 60000),
      })),
    );
    if (status === "cancelled") {
      await db.insert(orderEvents).values({ orderId: order.id, status: "cancelled", message: "ألغى الزبون الطلب" });
    }
    await db.insert(payments).values({
      orderId: order.id,
      provider: i % 3 === 0 ? "sandbox_gateway" : "cash_on_delivery",
      method: i % 3 === 0 ? "card" : "cash",
      amount: total,
      status: status === "delivered" ? "paid" : "pending",
      reference: `REF-${order.code}`,
    });
  }

  await db.insert(notifications).values([
    { userId: customer.id, audience: "customer", title: "طلبك في الطريق 🛵", body: "السائق رشيد فطريقو ليك دابا.", type: "order", link: "/account/orders" },
    { userId: customer.id, audience: "customer", title: "كوبون جديد ليك", body: "استعمل SAKHRTI30 وربح 30%.", type: "promo", link: "/offers" },
    { userId: vendor.id, audience: "vendor", title: "طلب جديد", body: "توصلت بطلب جديد فمحلك.", type: "order", link: "/vendor" },
    { userId: admin.id, audience: "admin", title: "محل جديد فانتظار الموافقة", body: "طاجين البركة طلب الانضمام.", type: "system", link: "/admin/stores" },
  ]);

  await db
    .insert(settings)
    .values([
      {
        key: "platform",
        value: {
          name: "سخرتي",
          tagline: "كلشي لي بغيتي... حتى لباب دارك",
          serviceFee: 300,
          defaultCommission: 10,
          currency: "MAD",
          supportPhone: "0808000000",
        },
      },
      {
        key: "demo_accounts",
        value: {
          password: demoPassword,
          accounts: [
            { role: "admin", email: process.env.ADMIN_EMAIL || "admin@sakhrti.ma", label: "لوحة التحكم" },
            { role: "vendor", email: "vendor@sakhrti.ma", label: "لوحة التاجر" },
            { role: "driver", email: "driver@sakhrti.ma", label: "لوحة السائق" },
            { role: "customer", email: "client@sakhrti.ma", label: "حساب زبون" },
          ],
          adminUsesEnvPassword: Boolean(process.env.ADMIN_PASSWORD),
        },
      },
      { key: "seed_version", value: { version: SEED_VERSION } },
    ])
    .onConflictDoUpdate({ target: settings.key, set: { value: sql`excluded.value` } });
}

const globalForSeed = globalThis as typeof globalThis & { __skhSeed?: Promise<void> };

export async function ensureSeeded() {
  if (globalForSeed.__skhSeed) return globalForSeed.__skhSeed;
  globalForSeed.__skhSeed = (async () => {
    try {
      if (await isSeeded()) return;
      await runSeed();
    } catch (error) {
      globalForSeed.__skhSeed = undefined;
      console.error("[sakhrti] seed failed", error);
    }
  })();
  return globalForSeed.__skhSeed;
}
