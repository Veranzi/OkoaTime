const testimonials = [
  {
    name: "Fatuma Hassan",
    role: "Regular Customer, Lamu",
    avatar: "FH",
    rating: 5,
    text: "Nimepata samaki safi kila siku bila kwenda sokoni. OkoaTime imebadilisha maisha yangu. Wanafikia haraka sana!",
    translation: "I get fresh fish every day without going to the market. OkoaTime has changed my life. They arrive very quickly!",
  },
  {
    name: "Ahmed Bakari",
    role: "Hotel Manager, Shela",
    avatar: "AB",
    rating: 5,
    text: "As a hotel manager, sourcing fresh supplies used to be a daily headache. OkoaTime handles it all — fresh seafood at my door by 7 AM. Incredible service.",
    translation: null,
  },
  {
    name: "Mama Rehema",
    role: "Supplier, Mama Mboga",
    avatar: "MR",
    rating: 5,
    text: "Mauzo yangu yameongezeka mara tatu tangu nijiunge na OkoaTime. Wateja wananipata bila kuja dukani. Asante sana!",
    translation: "My sales have tripled since joining OkoaTime. Customers find me without coming to the shop. Thank you so much!",
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-orange font-josefin font-semibold uppercase tracking-wider text-sm mb-3">
            Customer Stories
          </p>
          <h2 className="section-title mb-4">Loved by Lamu Locals</h2>
          <p className="text-gray-500 font-josefin max-w-xl mx-auto">
            Don&apos;t just take our word for it — hear from our customers and suppliers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div key={t.name} className="card hover:shadow-card-hover transition-shadow duration-300">
              {/* Stars */}
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <span key={i} className="text-orange text-lg">★</span>
                ))}
              </div>

              {/* Quote */}
              <p className="font-josefin text-gray-700 text-sm leading-relaxed mb-2 italic">
                &ldquo;{t.text}&rdquo;
              </p>
              {t.translation && (
                <p className="font-josefin text-gray-400 text-xs leading-relaxed italic mb-4">
                  ({t.translation})
                </p>
              )}

              {/* Author */}
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                <div className="w-10 h-10 bg-navy rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="font-outfit font-bold text-white text-sm">{t.avatar}</span>
                </div>
                <div>
                  <p className="font-outfit font-semibold text-navy text-sm">{t.name}</p>
                  <p className="font-josefin text-gray-400 text-xs">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
