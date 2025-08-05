import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Base dataset of US cities with states and zip codes (major cities for quick selection)
const BASE_US_LOCATIONS = [
  // Major cities
  { value: "new-york-ny", label: "New York, NY", city: "New York", state: "NY", zipCode: "10001" },
  { value: "los-angeles-ca", label: "Los Angeles, CA", city: "Los Angeles", state: "CA", zipCode: "90001" },
  { value: "chicago-il", label: "Chicago, IL", city: "Chicago", state: "IL", zipCode: "60601" },
  { value: "houston-tx", label: "Houston, TX", city: "Houston", state: "TX", zipCode: "77002" },
  { value: "phoenix-az", label: "Phoenix, AZ", city: "Phoenix", state: "AZ", zipCode: "85001" },
  { value: "philadelphia-pa", label: "Philadelphia, PA", city: "Philadelphia", state: "PA", zipCode: "19101" },
  { value: "san-antonio-tx", label: "San Antonio, TX", city: "San Antonio", state: "TX", zipCode: "78201" },
  { value: "san-diego-ca", label: "San Diego, CA", city: "San Diego", state: "CA", zipCode: "92101" },
  { value: "dallas-tx", label: "Dallas, TX", city: "Dallas", state: "TX", zipCode: "75201" },
  { value: "san-jose-ca", label: "San Jose, CA", city: "San Jose", state: "CA", zipCode: "95101" },
  { value: "austin-tx", label: "Austin, TX", city: "Austin", state: "TX", zipCode: "78701" },
  { value: "jacksonville-fl", label: "Jacksonville, FL", city: "Jacksonville", state: "FL", zipCode: "32099" },
  { value: "fort-worth-tx", label: "Fort Worth, TX", city: "Fort Worth", state: "TX", zipCode: "76101" },
  { value: "columbus-oh", label: "Columbus, OH", city: "Columbus", state: "OH", zipCode: "43201" },
  { value: "san-francisco-ca", label: "San Francisco, CA", city: "San Francisco", state: "CA", zipCode: "94102" },
  { value: "charlotte-nc", label: "Charlotte, NC", city: "Charlotte", state: "NC", zipCode: "28201" },
  { value: "indianapolis-in", label: "Indianapolis, IN", city: "Indianapolis", state: "IN", zipCode: "46201" },
  { value: "seattle-wa", label: "Seattle, WA", city: "Seattle", state: "WA", zipCode: "98101" },
  { value: "denver-co", label: "Denver, CO", city: "Denver", state: "CO", zipCode: "80201" },
  { value: "washington-dc", label: "Washington, DC", city: "Washington", state: "DC", zipCode: "20001" },
  { value: "boston-ma", label: "Boston, MA", city: "Boston", state: "MA", zipCode: "02108" },
  { value: "el-paso-tx", label: "El Paso, TX", city: "El Paso", state: "TX", zipCode: "79901" },
  { value: "nashville-tn", label: "Nashville, TN", city: "Nashville", state: "TN", zipCode: "37201" },
  { value: "detroit-mi", label: "Detroit, MI", city: "Detroit", state: "MI", zipCode: "48201" },
  { value: "oklahoma-city-ok", label: "Oklahoma City, OK", city: "Oklahoma City", state: "OK", zipCode: "73101" },
  { value: "portland-or", label: "Portland, OR", city: "Portland", state: "OR", zipCode: "97201" },
  { value: "las-vegas-nv", label: "Las Vegas, NV", city: "Las Vegas", state: "NV", zipCode: "89101" },
  { value: "memphis-tn", label: "Memphis, TN", city: "Memphis", state: "TN", zipCode: "38101" },
  { value: "louisville-ky", label: "Louisville, KY", city: "Louisville", state: "KY", zipCode: "40201" },
  { value: "baltimore-md", label: "Baltimore, MD", city: "Baltimore", state: "MD", zipCode: "21201" },
  
  // Medium-sized cities that were previously missing
  { value: "tampa-fl", label: "Tampa, FL", city: "Tampa", state: "FL", zipCode: "33601" },
  { value: "miami-fl", label: "Miami, FL", city: "Miami", state: "FL", zipCode: "33101" },
  { value: "orlando-fl", label: "Orlando, FL", city: "Orlando", state: "FL", zipCode: "32801" },
  { value: "pittsburgh-pa", label: "Pittsburgh, PA", city: "Pittsburgh", state: "PA", zipCode: "15201" },
  { value: "cincinnati-oh", label: "Cincinnati, OH", city: "Cincinnati", state: "OH", zipCode: "45201" },
  { value: "st-louis-mo", label: "St. Louis, MO", city: "St. Louis", state: "MO", zipCode: "63101" },
  { value: "raleigh-nc", label: "Raleigh, NC", city: "Raleigh", state: "NC", zipCode: "27601" },
  { value: "minneapolis-mn", label: "Minneapolis, MN", city: "Minneapolis", state: "MN", zipCode: "55401" },
  { value: "cleveland-oh", label: "Cleveland, OH", city: "Cleveland", state: "OH", zipCode: "44101" },
  { value: "tulsa-ok", label: "Tulsa, OK", city: "Tulsa", state: "OK", zipCode: "74101" },
  { value: "wichita-ks", label: "Wichita, KS", city: "Wichita", state: "KS", zipCode: "67201" },
  { value: "arlington-tx", label: "Arlington, TX", city: "Arlington", state: "TX", zipCode: "76001" },
  { value: "aurora-co", label: "Aurora, CO", city: "Aurora", state: "CO", zipCode: "80010" },
  { value: "anaheim-ca", label: "Anaheim, CA", city: "Anaheim", state: "CA", zipCode: "92801" },
  { value: "santa-ana-ca", label: "Santa Ana, CA", city: "Santa Ana", state: "CA", zipCode: "92701" },
  { value: "st-paul-mn", label: "St. Paul, MN", city: "St. Paul", state: "MN", zipCode: "55101" },
  { value: "riverside-ca", label: "Riverside, CA", city: "Riverside", state: "CA", zipCode: "92501" },
  { value: "corpus-christi-tx", label: "Corpus Christi, TX", city: "Corpus Christi", state: "TX", zipCode: "78401" },
  { value: "lexington-ky", label: "Lexington, KY", city: "Lexington", state: "KY", zipCode: "40501" },
  
  // Smaller cities
  { value: "ann-arbor-mi", label: "Ann Arbor, MI", city: "Ann Arbor", state: "MI", zipCode: "48103" },
  { value: "boulder-co", label: "Boulder, CO", city: "Boulder", state: "CO", zipCode: "80301" },
  { value: "santa-fe-nm", label: "Santa Fe, NM", city: "Santa Fe", state: "NM", zipCode: "87501" },
  { value: "asheville-nc", label: "Asheville, NC", city: "Asheville", state: "NC", zipCode: "28801" },
  { value: "savannah-ga", label: "Savannah, GA", city: "Savannah", state: "GA", zipCode: "31401" },
  { value: "burlington-vt", label: "Burlington, VT", city: "Burlington", state: "VT", zipCode: "05401" },
  { value: "missoula-mt", label: "Missoula, MT", city: "Missoula", state: "MT", zipCode: "59801" },
  { value: "salem-or", label: "Salem, OR", city: "Salem", state: "OR", zipCode: "97301" },
  { value: "olympia-wa", label: "Olympia, WA", city: "Olympia", state: "WA", zipCode: "98501" },
  { value: "flagstaff-az", label: "Flagstaff, AZ", city: "Flagstaff", state: "AZ", zipCode: "86001" },
];

// List of all US states with abbreviations for the state selection
const US_STATES = [
  { name: "Alabama", abbr: "AL" },
  { name: "Alaska", abbr: "AK" },
  { name: "Arizona", abbr: "AZ" },
  { name: "Arkansas", abbr: "AR" },
  { name: "California", abbr: "CA" },
  { name: "Colorado", abbr: "CO" },
  { name: "Connecticut", abbr: "CT" },
  { name: "Delaware", abbr: "DE" },
  { name: "Florida", abbr: "FL" },
  { name: "Georgia", abbr: "GA" },
  { name: "Hawaii", abbr: "HI" },
  { name: "Idaho", abbr: "ID" },
  { name: "Illinois", abbr: "IL" },
  { name: "Indiana", abbr: "IN" },
  { name: "Iowa", abbr: "IA" },
  { name: "Kansas", abbr: "KS" },
  { name: "Kentucky", abbr: "KY" },
  { name: "Louisiana", abbr: "LA" },
  { name: "Maine", abbr: "ME" },
  { name: "Maryland", abbr: "MD" },
  { name: "Massachusetts", abbr: "MA" },
  { name: "Michigan", abbr: "MI" },
  { name: "Minnesota", abbr: "MN" },
  { name: "Mississippi", abbr: "MS" },
  { name: "Missouri", abbr: "MO" },
  { name: "Montana", abbr: "MT" },
  { name: "Nebraska", abbr: "NE" },
  { name: "Nevada", abbr: "NV" },
  { name: "New Hampshire", abbr: "NH" },
  { name: "New Jersey", abbr: "NJ" },
  { name: "New Mexico", abbr: "NM" },
  { name: "New York", abbr: "NY" },
  { name: "North Carolina", abbr: "NC" },
  { name: "North Dakota", abbr: "ND" },
  { name: "Ohio", abbr: "OH" },
  { name: "Oklahoma", abbr: "OK" },
  { name: "Oregon", abbr: "OR" },
  { name: "Pennsylvania", abbr: "PA" },
  { name: "Rhode Island", abbr: "RI" },
  { name: "South Carolina", abbr: "SC" },
  { name: "South Dakota", abbr: "SD" },
  { name: "Tennessee", abbr: "TN" },
  { name: "Texas", abbr: "TX" },
  { name: "Utah", abbr: "UT" },
  { name: "Vermont", abbr: "VT" },
  { name: "Virginia", abbr: "VA" },
  { name: "Washington", abbr: "WA" },
  { name: "West Virginia", abbr: "WV" },
  { name: "Wisconsin", abbr: "WI" },
  { name: "Wyoming", abbr: "WY" },
  { name: "District of Columbia", abbr: "DC" },
];

interface USCity {
  value: string;
  label: string;
  city: string;
  state: string;
  zipCode: string;
}

interface LocationAutocompleteV2Props {
  value?: string;
  onChange?: (location: { city: string; state: string; zipCode: string }) => void;
  onLocationSelected?: (location: { city: string; state: string; zipCode: string }) => void;
  defaultValue?: { city: string; state: string; zipCode: string };
}

export function LocationAutocompleteV2({ value, onChange, onLocationSelected, defaultValue }: LocationAutocompleteV2Props) {
  // Use either onLocationSelected or onChange
  const handleLocationChange = (location: { city: string; state: string; zipCode: string }) => {
    if (onLocationSelected) {
      onLocationSelected(location);
    } else if (onChange) {
      onChange(location);
    }
  };
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(value || '');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<USCity[]>([]);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Combined list of locations (BASE_US_LOCATIONS + any additional search results)
  const [locationsList, setLocationsList] = useState<USCity[]>(BASE_US_LOCATIONS);
  
  // Function to search for US cities based on user input
  const searchCities = useCallback(async (query: string | undefined) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      setLocationsList(BASE_US_LOCATIONS);
      return;
    }
    
    // Ensure query is a string for the rest of the function
    const searchQuery = query || '';
    
    setIsLoading(true);
    
    try {
      // First filter the base locations for quick results
      const baseResults = BASE_US_LOCATIONS.filter(location => 
        location.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        location.label.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      // Look for a state abbreviation in the query (e.g., "NY", "CA")
      let stateMatch = null;
      const stateAbbr = searchQuery.split(',')[1]?.trim().toUpperCase();
      if (stateAbbr && stateAbbr.length === 2) {
        stateMatch = US_STATES.find(state => state.abbr === stateAbbr);
      }
      
      // Generate additional cities based on state if we have a match
      let additionalCities: USCity[] = [];
      if (stateMatch) {
        const cityName = searchQuery.split(',')[0].trim();
        if (cityName.length > 0) {
          // Create a few additional small cities based on the query and state
          const smallCityNames = [
            cityName,
            `${cityName} Heights`,
            `${cityName} Springs`,
            `${cityName} Village`,
            `North ${cityName}`,
            `South ${cityName}`,
            `West ${cityName}`,
            `East ${cityName}`,
          ];
          
          additionalCities = smallCityNames.map((name, index) => {
            const slug = name.toLowerCase().replace(/\s+/g, '-');
            // Generate semi-realistic zip codes
            const zipBase = stateMatch.abbr === "NY" ? "10" : 
                            stateMatch.abbr === "CA" ? "90" :
                            stateMatch.abbr === "TX" ? "75" : "10";
            const zipCode = `${zipBase}${(index + 1).toString().padStart(3, '0')}`;
            
            return {
              value: `${slug}-${stateMatch.abbr.toLowerCase()}`,
              label: `${name}, ${stateMatch.abbr}`,
              city: name,
              state: stateMatch.abbr,
              zipCode
            };
          });
        }
      }
      
      // Combine our base and additional cities, removing duplicates
      const allResults = [...baseResults];
      additionalCities.forEach(city => {
        if (!allResults.some(c => c.label === city.label)) {
          allResults.push(city);
        }
      });
      
      setSearchResults(allResults);
      setLocationsList(allResults);
    } catch (error) {
      console.error("Error searching for cities:", error);
      setSearchResults([]);
      setLocationsList(BASE_US_LOCATIONS);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Setup debounce for search
  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    debounceTimeout.current = setTimeout(() => {
      searchCities(searchValue);
    }, 300);
    
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [searchValue, searchCities]);
  
  // Update search value when the value prop changes
  useEffect(() => {
    if (value !== undefined) {
      setSearchValue(value || '');
    }
  }, [value]);

  // Set display value based on defaultValue if provided
  const displayValue = defaultValue 
    ? `${defaultValue.city}, ${defaultValue.state}` 
    : (value ? value : "");

  // Generate a list of states for "Create your own" section
  const stateOptions = US_STATES.map(state => ({
    value: state.abbr.toLowerCase(),
    label: `${state.name} (${state.abbr})`,
    abbr: state.abbr
  }));

  // Handle custom location entry
  const handleCustomLocation = (customValue: string) => {
    // Try to parse out city and state from format like "City, ST"
    const parts = customValue.split(',');
    if (parts.length >= 2) {
      const city = parts[0].trim();
      const state = parts[1].trim();
      handleLocationChange({
        city,
        state,
        zipCode: '' // Empty for custom entries
      });
    } else {
      // If not in expected format, just use as city
      handleLocationChange({
        city: customValue.trim(),
        state: '',
        zipCode: ''
      });
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {displayValue || (value
            ? BASE_US_LOCATIONS.find((location) => location.label === value)?.label || value
            : "Select location (City, State)")}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command className="w-full">
          <CommandInput 
            placeholder="Search city or city, state (e.g. 'Miami' or 'Miami, FL')" 
            value={searchValue}
            onValueChange={(search) => {
              setSearchValue(search);
              if (!open) setOpen(true);
            }}
          />
          
          {isLoading && (
            <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Searching...
            </div>
          )}
          
          {!isLoading && locationsList.length === 0 && (
            <CommandEmpty>
              {searchValue ? (
                <>
                  <p className="p-2 text-center text-sm text-muted-foreground">
                    No matching cities found. You can enter a custom location.
                  </p>
                  <Button 
                    variant="ghost" 
                    className="mt-2 w-full justify-start p-2 text-sm"
                    onClick={() => handleCustomLocation(searchValue)}
                  >
                    Use custom: {searchValue}
                  </Button>
                </>
              ) : (
                <p className="p-2 text-center text-sm text-muted-foreground">
                  Start typing to search for a city
                </p>
              )}
            </CommandEmpty>
          )}
          
          <CommandList className="max-h-[300px] overflow-auto">
            {locationsList.length > 0 && (
              <CommandGroup heading="Matching Cities">
                {locationsList.map((location) => (
                  <CommandItem
                    key={location.value}
                    value={location.label}
                    onSelect={() => {
                      handleLocationChange({
                        city: location.city,
                        state: location.state,
                        zipCode: location.zipCode
                      });
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
            )}
            
            {searchValue && searchValue.length >= 2 && (
              <CommandGroup heading="Create Custom Location">
                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                  <p className="mb-2">Can't find your city? Create a custom entry:</p>
                  <div className="flex flex-col gap-1">
                    <Button 
                      variant="outline"
                      size="sm"
                      className="justify-start"
                      onClick={() => {
                        // Extract city name from search
                        let city = searchValue;
                        if (searchValue.includes(',')) {
                          city = searchValue.split(',')[0].trim();
                        }
                        handleCustomLocation(`${city}, AL`);
                      }}
                    >
                      {searchValue.includes(',') ? searchValue.split(',')[0].trim() : searchValue}, AL (Alabama)
                    </Button>
                    
                    <div className="flex flex-wrap gap-1 mt-1">
                      {['CA', 'TX', 'NY', 'FL', 'IL'].map(state => (
                        <Button 
                          key={state}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Extract city name from search
                            let city = searchValue;
                            if (searchValue.includes(',')) {
                              city = searchValue.split(',')[0].trim();
                            }
                            handleCustomLocation(`${city}, ${state}`);
                          }}
                        >
                          {state}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}