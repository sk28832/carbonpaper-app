// File: components/AIChat/CommandPalette.tsx

import React, { useState, useEffect } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { InputMode } from "@/types/chatTypes";

interface CommandExamples {
  [key: string]: {
    [subcategory: string]: string[];
  };
}

const commandExamples: CommandExamples = {
  question: {
    "Document Overview": [
      "Summarize the terms of this document",
      "Generate an email with the terms of this document that I can send my client",
      "What are the key differences between [version A] and [version B] of this document?",
      "Identify the main parties and their roles in this agreement",
      "What are the primary obligations of each party in this contract?",
      "Summarize the indemnification provisions in this agreement",
      "What are the key dates and deadlines mentioned in this document?",
      "Outline the termination clauses and their conditions",
    ],
    "Clause Analysis": [
      "Define [term]",
      "Explain the implications of [clause] in simple terms",
      "What are the potential risks in [section]?",
      "Compare [clause A] with [clause B]",
      "Identify any ambiguous language in [paragraph]",
      "What are the potential loopholes in [clause]?",
      "Explain the interplay between [clause A] and [clause B]",
      "How does the force majeure clause apply in this situation?",
      "Analyze the non-compete clause for enforceability",
      "What are the key components of the intellectual property clause?",
      "How comprehensive is the confidentiality clause?",
      "Explain the implications of the choice of law clause",
      "What scenarios does the indemnification clause cover?",
    ],
    // ... (other categories)
  },
  edit: {
    "Language Modification": [
      "Change the [X] to [Y]",
      "Make [section] shorter while maintaining legal definitions and information",
      "Remove legalese",
      "Rewrite [paragraph] to improve clarity without changing legal meaning",
      "Strengthen the language in [clause] to favor [party]",
      "Revise [clause] to be more specific about [term/condition]",
      "Simplify the language in [section] for a lay audience",
      "Make the force majeure clause more comprehensive",
      "Tighten the language in the confidentiality provisions",
      "Clarify the termination conditions in plain language",
    ],
    // ... (other categories)
  },
  draft: {
    "General Drafting": [
      "Draft a [type] clause",
      "Create a new section for [topic]",
      "Write a paragraph about [subject]",
      "Draft a preamble for this agreement",
      "Create a definitions section for key terms",
      "Write a clause outlining the scope of the agreement",
    ],
    // ... (other categories)
  },
  research: {
    "Case Law and Legal Principles": [
      "Provide an overview of recent case law on [topic]",
      "Summarize key legal principles for [area of law]",
      "Analyze the circuit split on [legal issue]",
      "Examine the legal arguments in [notable case] and their potential wider impact",
      "Examine the impact of [Supreme Court decision] on [area of law]",
      "Research the evolution of the [legal doctrine] over the past decade",
      "Analyze how courts have interpreted [specific clause] in recent years",
      "Investigate the application of [legal theory] in international arbitration",
    ],
    // ... (other categories)
  },
};

interface CommandPaletteProps {
  mode: InputMode;
  onSelectExample: (example: string) => void;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ mode, onSelectExample, isOpen, setIsOpen }) => {
  const [search, setSearch] = useState<string>("");

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [setIsOpen]);

  const filteredExamples = Object.entries(commandExamples[mode]).flatMap(([subcategory, examples]) =>
    examples.filter((example) =>
      example.toLowerCase().includes(search.toLowerCase())
    ).map((example) => ({ subcategory, example }))
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden bg-white rounded-lg shadow-lg">
        <Command className="border-none">
          <div className="flex items-center border-b px-3">
            <CommandInput
              placeholder="Search example prompts..."
              value={search}
              onValueChange={setSearch}
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <CommandList className="max-h-[300px] overflow-y-auto">
            <CommandEmpty className="py-6 text-center text-sm">No examples found.</CommandEmpty>
            {Object.entries(commandExamples[mode]).map(([subcategory, examples]) => (
              <CommandGroup key={subcategory} heading={subcategory} className="px-2 py-2">
                {examples
                  .filter((example) => example.toLowerCase().includes(search.toLowerCase()))
                  .map((example, index) => (
                    <CommandItem
                      key={index}
                      onSelect={() => {
                        onSelectExample(example);
                        setIsOpen(false);
                      }}
                      className="px-2 py-1.5 text-sm rounded-md cursor-pointer hover:bg-gray-100"
                    >
                      {example}
                    </CommandItem>
                  ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
};

interface CommandPaletteTriggerProps {
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const CommandPaletteTrigger: React.FC<CommandPaletteTriggerProps> = ({ setIsOpen }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(true)} className="absolute right-2 top-2">
          <HelpCircle className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Command Palette</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export { CommandPalette, CommandPaletteTrigger };