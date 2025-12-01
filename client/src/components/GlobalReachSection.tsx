import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Globe2 } from "lucide-react";
import SA from 'country-flag-icons/react/3x2/SA';
import US from 'country-flag-icons/react/3x2/US';
import CA from 'country-flag-icons/react/3x2/CA';
import GB from 'country-flag-icons/react/3x2/GB';
import AE from 'country-flag-icons/react/3x2/AE';
import PK from 'country-flag-icons/react/3x2/PK';
import NG from 'country-flag-icons/react/3x2/NG';
import DE from 'country-flag-icons/react/3x2/DE';
import IT from 'country-flag-icons/react/3x2/IT';

const countries = [
  { name: "Saudi Arabia", code: "SA", isPrimary: true, comingSoon: false, Flag: SA },
  { name: "United States", code: "US", isPrimary: false, comingSoon: false, Flag: US },
  { name: "Canada", code: "CA", isPrimary: false, comingSoon: false, Flag: CA },
  { name: "United Kingdom", code: "UK", isPrimary: false, comingSoon: false, Flag: GB },
  { name: "Dubai (UAE)", code: "AE", isPrimary: false, comingSoon: false, Flag: AE },
  { name: "Pakistan", code: "PK", isPrimary: false, comingSoon: false, Flag: PK },
  { name: "Nigeria", code: "NG", isPrimary: false, comingSoon: false, Flag: NG },
  { name: "Germany", code: "DE", isPrimary: false, comingSoon: true, Flag: DE },
  { name: "Italy", code: "IT", isPrimary: false, comingSoon: true, Flag: IT },
];


export default function GlobalReachSection() {
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  return (
    <section className="relative py-14 md:py-20 bg-gradient-to-b from-background via-muted/20 to-muted/40 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-background to-transparent"></div>
      
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 right-0 w-80 h-80 bg-secondary/40 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-0 w-80 h-80 bg-primary/40 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-4 py-2 rounded-full mb-6">
            <Globe2 className="w-4 h-4" />
            <span className="text-sm font-semibold">International Platform</span>
          </div>
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-4"
            data-testid="text-global-reach-title"
          >
            Global Reach
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-secondary via-primary to-accent mx-auto rounded-full mb-6"></div>
          <p className="text-muted-foreground max-w-3xl mx-auto text-lg">
            Launching first in Saudi Arabia, now open to USA, Canada, UK, Dubai, Pakistan, Nigeria, and more coming soon
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {countries.map((country) => (
            <Card
              key={country.code}
              className={`transition-all duration-300 hover-elevate cursor-pointer ${
                hoveredCountry === country.code ? "shadow-lg border-primary" : ""
              } ${country.isPrimary ? "border-2 border-primary bg-primary/5" : ""} ${
                country.comingSoon ? "opacity-60" : ""
              }`}
              onMouseEnter={() => setHoveredCountry(country.code)}
              onMouseLeave={() => setHoveredCountry(null)}
              data-testid={`card-country-${country.code.toLowerCase()}`}
            >
              <CardContent className="p-6 flex flex-col items-center gap-4">
                <div className="w-full aspect-[3/2] rounded-md overflow-hidden shadow-sm border">
                  <country.Flag className="w-full h-full object-cover" />
                </div>
                <div className="text-center w-full">
                  <h3 className="font-semibold text-lg mb-1">{country.name}</h3>
                  {country.isPrimary && (
                    <p className="text-sm text-primary font-semibold">Primary Launch Market</p>
                  )}
                  {!country.isPrimary && !country.comingSoon && (
                    <p className="text-sm text-muted-foreground">Supported Region</p>
                  )}
                  {country.comingSoon && (
                    <p className="text-sm text-muted-foreground font-medium">Coming Soon</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="relative w-full bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 rounded-2xl overflow-hidden p-12 border border-border/50">
          <div className="absolute inset-0 bg-white/50 dark:bg-background/50"></div>
          <div className="relative text-center max-w-3xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-display font-bold text-primary mb-4">
              Accepts Registrations From All Over the World
            </h3>
            <p className="text-lg text-muted-foreground">
              While launching first in Saudi Arabia, PEF welcomes professionals, employers, business owners, and investors from across the globe to join our platform and participate in building a massive database of talent and opportunities.
            </p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent"></div>
    </section>
  );
}
