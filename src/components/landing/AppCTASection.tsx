export default function AppCTASection() {
  return (
    <section className="py-20 bg-navy">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-sm font-josefin px-4 py-2 rounded-full border border-white/20 mb-6">
          <span>📲</span> Mobile App — Coming Soon
        </div>

        <h2 className="font-outfit font-black text-3xl md:text-4xl text-white mb-4">
          OkoaTime on Your Phone
        </h2>
        <p className="font-josefin text-navy-200 max-w-xl mx-auto mb-8">
          Our mobile app is coming soon to Google Play and App Store. Order, track, and manage everything
          from your Android or iPhone — optimized for low-bandwidth connections.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <div className="flex items-center gap-3 bg-white/10 border border-white/20 rounded-2xl px-6 py-4 hover:bg-white/20 transition-colors cursor-not-allowed">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-1.581l1.86 1.074a1 1 0 010 1.72l-1.86 1.074L15.396 12l2.302-2.874zM5.864 2.658L16.8 8.99l-2.302 2.302-8.635-8.634z"/>
            </svg>
            <div className="text-left">
              <p className="text-white/50 text-xs font-josefin">Coming Soon</p>
              <p className="text-white font-outfit font-bold text-sm">Google Play</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/10 border border-white/20 rounded-2xl px-6 py-4 hover:bg-white/20 transition-colors cursor-not-allowed">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            <div className="text-left">
              <p className="text-white/50 text-xs font-josefin">Coming Soon</p>
              <p className="text-white font-outfit font-bold text-sm">App Store</p>
            </div>
          </div>
        </div>

        <p className="mt-8 text-navy-300 font-josefin text-sm">
          For now, order directly at{" "}
          <span className="text-orange font-semibold">okoatime.co.ke</span> or via WhatsApp
        </p>
      </div>
    </section>
  );
}
