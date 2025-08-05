import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Expanded dataset of US cities with states
const US_LOCATIONS = [
  // Major cities
  { value: "new-york-ny", label: "New York, NY" },
  { value: "los-angeles-ca", label: "Los Angeles, CA" },
  { value: "chicago-il", label: "Chicago, IL" },
  { value: "houston-tx", label: "Houston, TX" },
  { value: "phoenix-az", label: "Phoenix, AZ" },
  { value: "philadelphia-pa", label: "Philadelphia, PA" },
  { value: "san-antonio-tx", label: "San Antonio, TX" },
  { value: "san-diego-ca", label: "San Diego, CA" },
  { value: "dallas-tx", label: "Dallas, TX" },
  { value: "san-jose-ca", label: "San Jose, CA" },
  { value: "austin-tx", label: "Austin, TX" },
  { value: "jacksonville-fl", label: "Jacksonville, FL" },
  { value: "fort-worth-tx", label: "Fort Worth, TX" },
  { value: "columbus-oh", label: "Columbus, OH" },
  { value: "san-francisco-ca", label: "San Francisco, CA" },
  { value: "charlotte-nc", label: "Charlotte, NC" },
  { value: "indianapolis-in", label: "Indianapolis, IN" },
  { value: "seattle-wa", label: "Seattle, WA" },
  { value: "denver-co", label: "Denver, CO" },
  { value: "washington-dc", label: "Washington, DC" },
  { value: "boston-ma", label: "Boston, MA" },
  { value: "el-paso-tx", label: "El Paso, TX" },
  { value: "nashville-tn", label: "Nashville, TN" },
  { value: "detroit-mi", label: "Detroit, MI" },
  { value: "oklahoma-city-ok", label: "Oklahoma City, OK" },
  { value: "portland-or", label: "Portland, OR" },
  { value: "las-vegas-nv", label: "Las Vegas, NV" },
  { value: "memphis-tn", label: "Memphis, TN" },
  { value: "louisville-ky", label: "Louisville, KY" },
  { value: "baltimore-md", label: "Baltimore, MD" },
  { value: "milwaukee-wi", label: "Milwaukee, WI" },
  { value: "albuquerque-nm", label: "Albuquerque, NM" },
  { value: "tucson-az", label: "Tucson, AZ" },
  { value: "fresno-ca", label: "Fresno, CA" },
  { value: "sacramento-ca", label: "Sacramento, CA" },
  { value: "atlanta-ga", label: "Atlanta, GA" },
  { value: "kansas-city-mo", label: "Kansas City, MO" },
  { value: "miami-fl", label: "Miami, FL" },
  { value: "tampa-fl", label: "Tampa, FL" },
  { value: "new-orleans-la", label: "New Orleans, LA" },
  { value: "cleveland-oh", label: "Cleveland, OH" },
  { value: "minneapolis-mn", label: "Minneapolis, MN" },
  { value: "pittsburgh-pa", label: "Pittsburgh, PA" },
  { value: "st-louis-mo", label: "St. Louis, MO" },
  { value: "cincinnati-oh", label: "Cincinnati, OH" },
  { value: "salt-lake-city-ut", label: "Salt Lake City, UT" },
  { value: "orlando-fl", label: "Orlando, FL" },
  { value: "buffalo-ny", label: "Buffalo, NY" },
  { value: "raleigh-nc", label: "Raleigh, NC" },
  { value: "hartford-ct", label: "Hartford, CT" },
  
  // Texas cities (including McKinney)
  { value: "mckinney-tx", label: "McKinney, TX" },
  { value: "plano-tx", label: "Plano, TX" },
  { value: "frisco-tx", label: "Frisco, TX" },
  { value: "allen-tx", label: "Allen, TX" },
  { value: "denton-tx", label: "Denton, TX" },
  { value: "irving-tx", label: "Irving, TX" },
  { value: "garland-tx", label: "Garland, TX" },
  { value: "arlington-tx", label: "Arlington, TX" },
  { value: "waco-tx", label: "Waco, TX" },
  { value: "lubbock-tx", label: "Lubbock, TX" },
  { value: "amarillo-tx", label: "Amarillo, TX" },
  { value: "corpus-christi-tx", label: "Corpus Christi, TX" },
  { value: "laredo-tx", label: "Laredo, TX" },
  { value: "killeen-tx", label: "Killeen, TX" },
  { value: "beaumont-tx", label: "Beaumont, TX" },
  { value: "brownsville-tx", label: "Brownsville, TX" },
  { value: "grand-prairie-tx", label: "Grand Prairie, TX" },
  { value: "mesquite-tx", label: "Mesquite, TX" },
  { value: "midland-tx", label: "Midland, TX" },
  { value: "odessa-tx", label: "Odessa, TX" },
  { value: "round-rock-tx", label: "Round Rock, TX" },
  { value: "wichita-falls-tx", label: "Wichita Falls, TX" },
  { value: "richardson-tx", label: "Richardson, TX" },
  { value: "tyler-tx", label: "Tyler, TX" },
  { value: "abilene-tx", label: "Abilene, TX" },
  { value: "college-station-tx", label: "College Station, TX" },
  { value: "galveston-tx", label: "Galveston, TX" },
  { value: "lewisville-tx", label: "Lewisville, TX" },

  // California cities
  { value: "oakland-ca", label: "Oakland, CA" },
  { value: "long-beach-ca", label: "Long Beach, CA" },
  { value: "bakersfield-ca", label: "Bakersfield, CA" },
  { value: "anaheim-ca", label: "Anaheim, CA" },
  { value: "santa-ana-ca", label: "Santa Ana, CA" },
  { value: "riverside-ca", label: "Riverside, CA" },
  { value: "stockton-ca", label: "Stockton, CA" },
  { value: "irvine-ca", label: "Irvine, CA" },
  { value: "santa-clara-ca", label: "Santa Clara, CA" },
  { value: "san-bernardino-ca", label: "San Bernardino, CA" },
  { value: "modesto-ca", label: "Modesto, CA" },
  { value: "oxnard-ca", label: "Oxnard, CA" },
  { value: "fontana-ca", label: "Fontana, CA" },
  { value: "moreno-valley-ca", label: "Moreno Valley, CA" },
  { value: "huntington-beach-ca", label: "Huntington Beach, CA" },
  { value: "santa-clarita-ca", label: "Santa Clarita, CA" },
  { value: "palm-springs-ca", label: "Palm Springs, CA" },
  { value: "santa-barbara-ca", label: "Santa Barbara, CA" },
  
  // Florida cities
  { value: "st-petersburg-fl", label: "St. Petersburg, FL" },
  { value: "hialeah-fl", label: "Hialeah, FL" },
  { value: "tallahassee-fl", label: "Tallahassee, FL" },
  { value: "port-st-lucie-fl", label: "Port St. Lucie, FL" },
  { value: "cape-coral-fl", label: "Cape Coral, FL" },
  { value: "fort-lauderdale-fl", label: "Fort Lauderdale, FL" },
  { value: "pembroke-pines-fl", label: "Pembroke Pines, FL" },
  { value: "gainesville-fl", label: "Gainesville, FL" },
  { value: "hollywood-fl", label: "Hollywood, FL" },
  { value: "clearwater-fl", label: "Clearwater, FL" },
  { value: "pompano-beach-fl", label: "Pompano Beach, FL" },
  { value: "west-palm-beach-fl", label: "West Palm Beach, FL" },
  { value: "lakeland-fl", label: "Lakeland, FL" },
  { value: "boca-raton-fl", label: "Boca Raton, FL" },
  { value: "panama-city-fl", label: "Panama City, FL" },
  { value: "key-west-fl", label: "Key West, FL" },
  
  // Additional cities from other states
  { value: "anchorage-ak", label: "Anchorage, AK" },
  { value: "birmingham-al", label: "Birmingham, AL" },
  { value: "little-rock-ar", label: "Little Rock, AR" },
  { value: "boulder-co", label: "Boulder, CO" },
  { value: "stamford-ct", label: "Stamford, CT" },
  { value: "wilmington-de", label: "Wilmington, DE" },
  { value: "savannah-ga", label: "Savannah, GA" },
  { value: "honolulu-hi", label: "Honolulu, HI" },
  { value: "des-moines-ia", label: "Des Moines, IA" },
  { value: "boise-id", label: "Boise, ID" },
  { value: "aurora-il", label: "Aurora, IL" },
  { value: "wichita-ks", label: "Wichita, KS" },
  { value: "lexington-ky", label: "Lexington, KY" },
  { value: "shreveport-la", label: "Shreveport, LA" },
  { value: "cambridge-ma", label: "Cambridge, MA" },
  { value: "ann-arbor-mi", label: "Ann Arbor, MI" },
  { value: "st-paul-mn", label: "St. Paul, MN" },
  { value: "jackson-ms", label: "Jackson, MS" },
  { value: "billings-mt", label: "Billings, MT" },
  { value: "charlotte-nc", label: "Charlotte, NC" },
  { value: "fargo-nd", label: "Fargo, ND" },
  { value: "lincoln-ne", label: "Lincoln, NE" },
  { value: "manchester-nh", label: "Manchester, NH" },
  { value: "newark-nj", label: "Newark, NJ" },
  { value: "santa-fe-nm", label: "Santa Fe, NM" },
  { value: "reno-nv", label: "Reno, NV" },
  { value: "rochester-ny", label: "Rochester, NY" },
  { value: "syracuse-ny", label: "Syracuse, NY" },
  { value: "toledo-oh", label: "Toledo, OH" },
  { value: "norman-ok", label: "Norman, OK" },
  { value: "eugene-or", label: "Eugene, OR" },
  { value: "erie-pa", label: "Erie, PA" },
  { value: "providence-ri", label: "Providence, RI" },
  { value: "charleston-sc", label: "Charleston, SC" },
  { value: "sioux-falls-sd", label: "Sioux Falls, SD" },
  { value: "knoxville-tn", label: "Knoxville, TN" },
  { value: "provo-ut", label: "Provo, UT" },
  { value: "richmond-va", label: "Richmond, VA" },
  { value: "burlington-vt", label: "Burlington, VT" },
  { value: "spokane-wa", label: "Spokane, WA" },
  { value: "madison-wi", label: "Madison, WI" },
  { value: "charleston-wv", label: "Charleston, WV" },
  { value: "cheyenne-wy", label: "Cheyenne, WY" },
];

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
}

export function LocationAutocomplete({ value, onChange }: LocationAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(value);
  
  // Filtering function for locations
  const filteredLocations = value === "" 
    ? US_LOCATIONS 
    : US_LOCATIONS.filter((location) => {
        return location.label.toLowerCase().includes(searchValue.toLowerCase());
      });
  
  useEffect(() => {
    setSearchValue(value);
  }, [value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value
            ? US_LOCATIONS.find((location) => location.label === value)?.label || value
            : "Select location (City, State)"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command className="w-full">
          <CommandInput 
            placeholder="Search location..." 
            value={searchValue}
            onValueChange={(search) => {
              setSearchValue(search);
              if (!open) setOpen(true);
            }}
          />
          <CommandEmpty>
            {searchValue ? (
              <>
                No location found. You can use "{searchValue}" or type a different city.
                <Button 
                  variant="ghost" 
                  className="mt-2 w-full justify-start"
                  onClick={() => {
                    onChange(searchValue);
                    setOpen(false);
                  }}
                >
                  Use custom: {searchValue}
                </Button>
              </>
            ) : (
              "Type to search locations..."
            )}
          </CommandEmpty>
          <CommandGroup className="max-h-60 overflow-y-auto">
            {filteredLocations.map((location) => (
              <CommandItem
                key={location.value}
                value={location.label}
                onSelect={(currentValue) => {
                  onChange(currentValue === value ? "" : currentValue);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === location.label ? "opacity-100" : "opacity-0"
                  )}
                />
                {location.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}