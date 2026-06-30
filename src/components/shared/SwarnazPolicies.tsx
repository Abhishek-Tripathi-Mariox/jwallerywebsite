// Official Swarnaz Smart Gold Jewellery policy content. Used as the fallback
// body for /return-policy and /terms when the admin CMS page isn't published.

const SECTIONS = [
  {
    title: "1. 5-Year Assured Buy Back Policy",
    intro: "At Swarnaz, we believe every purchase should be a smart investment.",
    bullets: [
      "You can exchange or sell back your Smart Gold Jewellery under our Buy Back Policy.",
      "Within 3 to 5 days of purchase, returns/exchanges are accepted as per our store guidelines (unused condition and original invoice required).",
      "After the initial return period, the jewellery will be eligible for 50% Assured Buy Back as per the prevailing company policy.",
      "After 5 years, the buy back value will be calculated according to the gold purity and the applicable company policy at that time.",
    ],
  },
  {
    title: "2. Product Care & Service",
    intro:
      "Your jewellery deserves proper care. From the date of purchase, if within 6 months you experience:",
    bullets: ["Colour fading", "Loss of shine", "Surface dullness"],
    outro:
      "Swarnaz will provide FREE polishing and cleaning service without altering the original design of the jewellery.",
  },
  {
    title: "3. Gold Purity",
    intro:
      "Swarnaz Smart Gold Jewellery is crafted using 24K Gold with 10% Gold Purity, offering:",
    bullets: [
      "Premium Luxury Finish",
      "Modern & Trendy Designs",
      "Lightweight Comfort",
      "Affordable Pricing",
      "Long-Lasting Appearance",
    ],
  },
  {
    title: "4. 5-Year Product Warranty",
    intro:
      "Every Swarnaz Smart Gold Jewellery comes with a 5-Year Warranty. If any manufacturing-related issue arises during the warranty period, Swarnaz will inspect the product and provide an appropriate solution as per the company's warranty and buy back policy.",
    bullets: [] as string[],
  },
];

const TERMS = [
  "Original Purchase Invoice is mandatory for all warranty, service and buy back claims.",
  "Warranty covers manufacturing defects only.",
  "Damage caused due to misuse, accidents, chemicals, perfume, water exposure or improper handling is not covered under warranty.",
  "Normal wear and tear is not considered a manufacturing defect.",
  "Free polishing service is available only within the eligible service period.",
  "Buy Back value will be calculated according to the company's prevailing policy and product condition.",
  "Products purchased under promotional offers may have different exchange or buy back conditions.",
  "Swarnaz reserves the right to modify the Buy Back Policy, Warranty and Terms & Conditions without prior notice.",
  "All disputes shall be subject to the jurisdiction of Patna, Bihar.",
];

export default function SwarnazPolicies({ showTermsOnly = false }: { showTermsOnly?: boolean }) {
  return (
    <div className="swarnaz-policies" style={{ lineHeight: 1.6, color: "#333" }}>
      {!showTermsOnly &&
        SECTIONS.map((s) => (
          <section key={s.title} style={{ marginBottom: 24 }}>
            <h3 style={{ color: "#930e6e", marginBottom: 8 }}>{s.title}</h3>
            {s.intro && <p style={{ margin: "0 0 8px" }}>{s.intro}</p>}
            {s.bullets.length > 0 && (
              <ul style={{ margin: "0 0 8px", paddingLeft: 20 }}>
                {s.bullets.map((b, i) => (
                  <li key={i} style={{ marginBottom: 4 }}>{b}</li>
                ))}
              </ul>
            )}
            {s.outro && <p style={{ margin: 0 }}>{s.outro}</p>}
          </section>
        ))}

      <section>
        <h2 style={{ marginBottom: 12 }}>Terms &amp; Conditions</h2>
        <ol style={{ paddingLeft: 20 }}>
          {TERMS.map((t, i) => (
            <li key={i} style={{ marginBottom: 6 }}>{t}</li>
          ))}
        </ol>
      </section>
    </div>
  );
}
