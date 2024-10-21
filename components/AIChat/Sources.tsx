// File: components/AIChat/Sources.tsx

import React, { useState, useMemo } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronRight, ChevronDown, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';

type Source = 'General Web' | 'Codes and Regulations' | 'Caselaw';
type Jurisdiction = 'Federal' | 'Alabama' | 'Alaska' | 'Arizona' | 'Arkansas' | 'California' | 'Colorado' | 'Connecticut' | 'Delaware' | 'Florida' | 'Georgia' | 'Hawaii' | 'Idaho' | 'Illinois' | 'Indiana' | 'Iowa' | 'Kansas' | 'Kentucky' | 'Louisiana' | 'Maine' | 'Maryland' | 'Massachusetts' | 'Michigan' | 'Minnesota' | 'Mississippi' | 'Missouri' | 'Montana' | 'Nebraska' | 'Nevada' | 'New Hampshire' | 'New Jersey' | 'New Mexico' | 'New York' | 'North Carolina' | 'North Dakota' | 'Ohio' | 'Oklahoma' | 'Oregon' | 'Pennsylvania' | 'Rhode Island' | 'South Carolina' | 'South Dakota' | 'Tennessee' | 'Texas' | 'Utah' | 'Vermont' | 'Virginia' | 'Washington' | 'West Virginia' | 'Wisconsin' | 'Wyoming';

interface SourcesProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSourceSelect: (sources: string[]) => void;
  currentSources: string[];
}

const Sources: React.FC<SourcesProps> = ({ isOpen, setIsOpen, onSourceSelect, currentSources }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSections, setExpandedSections] = useState<Record<Source, boolean>>({
    'General Web': true,
    'Codes and Regulations': true,
    'Caselaw': true,
  });

  const sources: Source[] = ['General Web', 'Codes and Regulations', 'Caselaw'];
  const jurisdictions: Jurisdiction[] = [
    'Federal', 'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
  ];

  const toggleSection = (source: Source) => {
    setExpandedSections(prev => ({ ...prev, [source]: !prev[source] }));
  };

  const handleSelect = (source: string) => {
    const updatedSources = currentSources.includes(source)
      ? currentSources.filter(s => s !== source)
      : [...currentSources, source];
    onSourceSelect(updatedSources);
  };

  const handleClear = () => {
    setSearchQuery("");
    setExpandedSections({
      'General Web': true,
      'Codes and Regulations': true,
      'Caselaw': true,
    });
  };

  const filteredData = useMemo(() => {
    const lowerQuery = searchQuery.toLowerCase();
    return sources.map(source => ({
      source,
      items: source === 'General Web'
        ? [source].filter(item => item.toLowerCase().includes(lowerQuery))
        : jurisdictions.filter(j => 
            j.toLowerCase().includes(lowerQuery) || 
            `${j} ${source}`.toLowerCase().includes(lowerQuery)
          )
    })).filter(group => group.items.length > 0);
  }, [searchQuery, sources, jurisdictions]);

  const hasResults = filteredData.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="p-0 w-96 max-w-[95vw]">
        <Command className="rounded-lg border shadow-md">
          <div className="flex items-center border-b px-3">
            <CommandInput 
              placeholder="Search sources..." 
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="flex-1"
            />
            <Button variant="ghost" size="sm" onClick={handleClear} className="ml-2">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CommandList>
            {!hasResults && <CommandEmpty>No results found.</CommandEmpty>}
            <ScrollArea className="h-[400px]">
              {filteredData.map(({ source, items }) => (
                <CommandGroup key={source} heading={
                  <div 
                    className="flex items-center cursor-pointer py-2 px-4 hover:bg-gray-100"
                    onClick={() => toggleSection(source)}
                  >
                    {expandedSections[source] ? (
                      <ChevronDown className="h-4 w-4 mr-2" />
                    ) : (
                      <ChevronRight className="h-4 w-4 mr-2" />
                    )}
                    <span className="font-medium">{source}</span>
                  </div>
                }>
                  {expandedSections[source] && items.map((item) => (
                    <CommandItem 
                      key={`${source}-${item}`}
                      onSelect={() => handleSelect(source === 'General Web' ? source : `${item} ${source}`)}
                      className="ml-6 cursor-pointer hover:bg-gray-100"
                    >
                      <div className="flex items-center">
                        <Input
                          type="checkbox"
                          checked={currentSources.includes(source === 'General Web' ? source : `${item} ${source}`)}
                          onChange={() => {}}
                          className="mr-2 h-3 w-3"
                          style={{ accentColor: 'black' }}
                        />
                        <span className="text-sm">
                          {source === 'General Web' ? source : `${item} ${source}`}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </ScrollArea>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
};

export default Sources;