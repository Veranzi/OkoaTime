import Button from "@/components/ui/Button";

export default function ContactSection() {
  return (
    <section id="contact" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <div>
            <p className="text-orange font-josefin font-semibold uppercase tracking-wider text-sm mb-3">Get In Touch</p>
            <h2 className="font-outfit font-black text-4xl text-navy mb-4">Contact Us</h2>
            <p className="font-josefin text-gray-600 mb-8">
              Have questions? Want to become a supplier or rider? We&apos;d love to hear from you.
            </p>

            <div className="space-y-4">
              {[
                { icon: "📍", label: "Location", value: "Lamu Island, Kenya" },
                { icon: "📞", label: "Phone / WhatsApp", value: "+254 700 000 000", href: "tel:+254700000000" },
                { icon: "✉️", label: "Email", value: "hello@okoatime.co.ke", href: "mailto:hello@okoatime.co.ke" },
                { icon: "🕐", label: "Operating Hours", value: "Daily 6:00 AM – 10:00 PM" },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <p className="font-josefin text-gray-400 text-xs uppercase tracking-wider">{item.label}</p>
                    {item.href ? (
                      <a href={item.href} className="font-josefin font-semibold text-navy hover:text-orange transition-colors">
                        {item.value}
                      </a>
                    ) : (
                      <p className="font-josefin font-semibold text-navy">{item.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Form */}
          <div className="card">
            <h3 className="font-outfit font-bold text-xl text-navy mb-6">Send a Message</h3>
            <form className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">First Name</label>
                  <input className="input-field" placeholder="Fatuma" />
                </div>
                <div>
                  <label className="label">Last Name</label>
                  <input className="input-field" placeholder="Hassan" />
                </div>
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input-field" type="email" placeholder="you@example.com" />
              </div>
              <div>
                <label className="label">Phone (WhatsApp)</label>
                <input className="input-field" type="tel" placeholder="+254 700 000 000" />
              </div>
              <div>
                <label className="label">Message</label>
                <textarea
                  className="input-field resize-none h-32"
                  placeholder="I'd like to know more about becoming a supplier..."
                />
              </div>
              <Button variant="primary" size="md" className="w-full" type="submit">
                Send Message
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
