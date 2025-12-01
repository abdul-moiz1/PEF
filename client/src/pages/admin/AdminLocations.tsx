import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Globe,
  MapPin,
  Search,
  ChevronRight,
  ChevronLeft,
  Pencil,
  Plus,
  Trash2,
  Check,
  X,
  ArrowLeft,
  Database,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Country, City } from "@shared/schema";

export default function AdminLocations() {
  const { currentUser, userData } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [citySearchQuery, setCitySearchQuery] = useState("");
  const [addCityDialogOpen, setAddCityDialogOpen] = useState(false);
  const [newCityName, setNewCityName] = useState("");

  const { data: countries = [], isLoading: countriesLoading, refetch: refetchCountries } = useQuery<Country[]>({
    queryKey: ["/api/admin/countries"],
    enabled: !!currentUser && !!userData?.roles?.admin,
  });

  const { data: cities = [], isLoading: citiesLoading, refetch: refetchCities } = useQuery<City[]>({
    queryKey: ["/api/admin/countries", selectedCountry?.id, "cities"],
    enabled: !!selectedCountry,
  });

  useEffect(() => {
    if (!currentUser) {
      setLocation("/login");
      return;
    }

    if (!userData?.roles?.admin) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page",
        variant: "destructive",
      });
      setLocation("/");
      return;
    }
  }, [currentUser, userData]);

  const updateCountryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Country> }) => {
      return apiRequest("PATCH", `/api/admin/countries/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/countries"] });
      setEditingCountry(null);
      toast({
        title: "Success",
        description: "Country updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update country",
        variant: "destructive",
      });
    },
  });

  const updateCityMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<City> }) => {
      return apiRequest("PATCH", `/api/admin/cities/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/countries", selectedCountry?.id, "cities"] });
      setEditingCity(null);
      toast({
        title: "Success",
        description: "City updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update city",
        variant: "destructive",
      });
    },
  });

  const createCityMutation = useMutation({
    mutationFn: async ({ countryId, name }: { countryId: string; name: string }) => {
      return apiRequest("POST", `/api/admin/countries/${countryId}/cities`, { name, enabled: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/countries", selectedCountry?.id, "cities"] });
      setAddCityDialogOpen(false);
      setNewCityName("");
      toast({
        title: "Success",
        description: "City added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add city",
        variant: "destructive",
      });
    },
  });

  const deleteCityMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/cities/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/countries", selectedCountry?.id, "cities"] });
      toast({
        title: "Success",
        description: "City deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete city",
        variant: "destructive",
      });
    },
  });

  const seedCountriesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/seed-countries");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/countries"] });
      toast({
        title: "Success",
        description: `${data.count} countries imported successfully`,
      });
    },
    onError: (error: Error) => {
      if (error.message.includes("already seeded")) {
        toast({
          title: "Info",
          description: "Countries already imported",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to import countries",
          variant: "destructive",
        });
      }
    },
  });

  const handleSeedCountries = () => {
    seedCountriesMutation.mutate();
  };

  const handleToggleCountryEnabled = (country: Country) => {
    updateCountryMutation.mutate({
      id: country.id,
      data: { enabled: !country.enabled },
    });
  };

  const handleToggleCityEnabled = (city: City) => {
    updateCityMutation.mutate({
      id: city.id,
      data: { enabled: !city.enabled },
    });
  };

  const handleSaveCountryName = (country: Country, displayName: string) => {
    updateCountryMutation.mutate({
      id: country.id,
      data: { displayName: displayName.trim() || null },
    });
  };

  const handleSaveCityName = (city: City, displayName: string) => {
    updateCityMutation.mutate({
      id: city.id,
      data: { displayName: displayName.trim() || null },
    });
  };

  const filteredCountries = countries.filter((country) => {
    const name = (country.displayName || country.name).toLowerCase();
    const code = country.code.toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || code.includes(query);
  });

  const filteredCities = cities.filter((city) => {
    const name = (city.displayName || city.name).toLowerCase();
    const query = citySearchQuery.toLowerCase();
    return name.includes(query);
  });

  const enabledCountriesCount = countries.filter((c) => c.enabled).length;
  const enabledCitiesCount = cities.filter((c) => c.enabled).length;

  if (countriesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading locations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-24 md:pt-28 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/admin")}
            data-testid="button-back-admin"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Globe className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold">Location Management</h1>
            </div>
            <p className="text-muted-foreground">Manage countries and cities for your platform</p>
          </div>
        </div>

        {countries.length === 0 ? (
          <Card className="max-w-lg mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Import Countries
              </CardTitle>
              <CardDescription>
                No countries found. Click below to import the standard country list.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleSeedCountries}
                disabled={seedCountriesMutation.isPending}
                className="w-full"
                data-testid="button-seed-countries"
              >
                {seedCountriesMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Import Country List
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Countries
                  </CardTitle>
                  <CardDescription>
                    {enabledCountriesCount} of {countries.length} enabled
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search countries..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    data-testid="input-search-countries"
                  />
                </div>

                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {filteredCountries.map((country) => (
                    <div
                      key={country.id}
                      className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                        selectedCountry?.id === country.id
                          ? "bg-accent border-accent-border"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => setSelectedCountry(country)}
                      data-testid={`country-row-${country.code}`}
                    >
                      <Switch
                        checked={country.enabled}
                        onCheckedChange={() => handleToggleCountryEnabled(country)}
                        onClick={(e) => e.stopPropagation()}
                        data-testid={`switch-country-${country.code}`}
                      />

                      {editingCountry?.id === country.id ? (
                        <div className="flex-1 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <Input
                            defaultValue={country.displayName || country.name}
                            className="flex-1"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleSaveCountryName(country, (e.target as HTMLInputElement).value);
                              } else if (e.key === "Escape") {
                                setEditingCountry(null);
                              }
                            }}
                            data-testid={`input-country-name-${country.code}`}
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              const input = document.querySelector(`[data-testid="input-country-name-${country.code}"]`) as HTMLInputElement;
                              if (input) {
                                handleSaveCountryName(country, input.value);
                              }
                            }}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCountry(null);
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1">
                            <div className="font-medium">
                              {country.displayName || country.name}
                              {country.displayName && country.displayName !== country.name && (
                                <span className="text-xs text-muted-foreground ml-2">
                                  (Original: {country.name})
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {country.code} {country.phoneCode && `| ${country.phoneCode}`}
                            </div>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCountry(country);
                            }}
                            data-testid={`button-edit-country-${country.code}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          {country.enabled && (
                            <Badge variant="secondary">Active</Badge>
                          )}
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </>
                      )}
                    </div>
                  ))}

                  {filteredCountries.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No countries found matching your search
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Cities
                    {selectedCountry && (
                      <Badge variant="outline" className="ml-2">
                        {selectedCountry.displayName || selectedCountry.name}
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {selectedCountry
                      ? `${enabledCitiesCount} of ${cities.length} enabled`
                      : "Select a country to manage cities"}
                  </CardDescription>
                </div>
                {selectedCountry && (
                  <Button
                    size="sm"
                    onClick={() => setAddCityDialogOpen(true)}
                    data-testid="button-add-city"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add City
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {!selectedCountry ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <MapPin className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>Select a country from the list to view and manage its cities</p>
                  </div>
                ) : citiesLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <>
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search cities..."
                        value={citySearchQuery}
                        onChange={(e) => setCitySearchQuery(e.target.value)}
                        className="pl-9"
                        data-testid="input-search-cities"
                      />
                    </div>

                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                      {filteredCities.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          {cities.length === 0
                            ? "No cities added yet. Click 'Add City' to create one."
                            : "No cities found matching your search"}
                        </div>
                      ) : (
                        filteredCities.map((city) => (
                          <div
                            key={city.id}
                            className="flex items-center gap-3 p-3 rounded-md border"
                            data-testid={`city-row-${city.id}`}
                          >
                            <Switch
                              checked={city.enabled}
                              onCheckedChange={() => handleToggleCityEnabled(city)}
                              data-testid={`switch-city-${city.id}`}
                            />

                            {editingCity?.id === city.id ? (
                              <div className="flex-1 flex items-center gap-2">
                                <Input
                                  defaultValue={city.displayName || city.name}
                                  className="flex-1"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      handleSaveCityName(city, (e.target as HTMLInputElement).value);
                                    } else if (e.key === "Escape") {
                                      setEditingCity(null);
                                    }
                                  }}
                                  data-testid={`input-city-name-${city.id}`}
                                />
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => {
                                    const input = document.querySelector(`[data-testid="input-city-name-${city.id}"]`) as HTMLInputElement;
                                    if (input) {
                                      handleSaveCityName(city, input.value);
                                    }
                                  }}
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => setEditingCity(null)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <>
                                <div className="flex-1">
                                  <div className="font-medium">
                                    {city.displayName || city.name}
                                    {city.displayName && city.displayName !== city.name && (
                                      <span className="text-xs text-muted-foreground ml-2">
                                        (Original: {city.name})
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => setEditingCity(city)}
                                  data-testid={`button-edit-city-${city.id}`}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => {
                                    if (confirm("Are you sure you want to delete this city?")) {
                                      deleteCityMutation.mutate(city.id);
                                    }
                                  }}
                                  data-testid={`button-delete-city-${city.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                                {city.enabled && (
                                  <Badge variant="secondary">Active</Badge>
                                )}
                              </>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <Dialog open={addCityDialogOpen} onOpenChange={setAddCityDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New City</DialogTitle>
              <DialogDescription>
                Add a new city to {selectedCountry?.displayName || selectedCountry?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="city-name">City Name</Label>
                <Input
                  id="city-name"
                  placeholder="Enter city name"
                  value={newCityName}
                  onChange={(e) => setNewCityName(e.target.value)}
                  data-testid="input-new-city-name"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddCityDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedCountry && newCityName.trim()) {
                    createCityMutation.mutate({
                      countryId: selectedCountry.id,
                      name: newCityName.trim(),
                    });
                  }
                }}
                disabled={!newCityName.trim() || createCityMutation.isPending}
                data-testid="button-confirm-add-city"
              >
                {createCityMutation.isPending ? "Adding..." : "Add City"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
}
