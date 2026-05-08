const stats = [
  { value: "500+", label: "Happy Customers" },
  { value: "20+", label: "Local Suppliers" },
  { value: "30-60 Min", label: "Delivery Time" },
  { value: "Lamu · Shela · Manda", label: "Areas Covered" },
];

export default function StatsBar() {
  return (
    <section className="bg-navy py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-outfit font-black text-2xl md:text-3xl text-orange">{stat.value}</p>
              <p className="font-josefin text-navy-200 text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
