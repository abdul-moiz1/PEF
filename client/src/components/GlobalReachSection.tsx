import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Globe2 } from "lucide-react";
import * as Flags from 'country-flag-icons/react/3x2';

interface Country {
  id: string;
  code: string;
  name: string;
  phoneCode: string | null;
  isPrimary: boolean;
  comingSoon: boolean;
}

const FlagComponent = ({ code, className }: { code: string; className?: string }) => {
  const upperCode = code.toUpperCase();
  const FlagIcon = (Flags as Record<string, React.ComponentType<{ className?: string }>>)[upperCode];
  
  if (FlagIcon) {
    return <FlagIcon className={className} />;
  }
  
  return (
    <div className={`bg-muted flex items-center justify-center ${className}`}>
      <span className="text-muted-foreground text-sm font-medium">{upperCode}</span>
    </div>
  );
};

export default function GlobalReachSection() {
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  const { data: countries = [], isLoading } = useQuery<Country[]>({
    queryKey: ["/api/locations/countries"],
  });

  const sortedCountries = [...countries].sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    if (!a.comingSoon && b.comingSoon) return -1;
    if (a.comingSoon && !b.comingSoon) return 1;
    return a.name.localeCompare(b.name);
  });

  const primaryCount = countries.filter(c => c.isPrimary).length;
  const activeCount = countries.filter(c => !c.comingSoon).length;
  const comingSoonCount = countries.filter(c => c.comingSoon).length;

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
            {activeCount > 0 ? (
              <>
                {primaryCount > 0 && "Launching first in our primary markets, "}
                now open to {activeCount} {activeCount === 1 ? "country" : "countries"}
                {comingSoonCount > 0 && `, with ${comingSoonCount} more coming soon`}
              </>
            ) : (
              "Expanding globally to connect professionals, employers, and investors worldwide"
            )}
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6 flex flex-col items-center gap-4">
                  <div className="w-full aspect-[3/2] rounded-md bg-muted"></div>
                  <div className="text-center w-full">
                    <div className="h-5 w-24 bg-muted rounded mx-auto mb-2"></div>
                    <div className="h-4 w-20 bg-muted rounded mx-auto"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : sortedCountries.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
            {sortedCountries.map((country) => (
              <Card
                key={country.id}
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
                    <FlagComponent code={country.code} className="w-full h-full object-cover" />
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
        ) : (
          <div className="text-center py-12 mb-12">
            <Globe2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground">Countries will be displayed here once configured by the admin.</p>
          </div>
        )}

        <div className="relative w-full bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 rounded-2xl overflow-hidden p-12 border border-border/50">
          <div className="absolute inset-0 bg-white/50 dark:bg-background/50"></div>
          <div className="relative text-center max-w-3xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-display font-bold text-primary mb-4">
              Accepts Registrations From All Over the World
            </h3>
            <p className="text-lg text-muted-foreground">
              While launching first in our primary markets, PEF welcomes professionals, employers, business owners, and investors from across the globe to join our platform and participate in building a massive database of talent and opportunities.
            </p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent"></div>
    </section>
  );
}
