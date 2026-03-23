import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Image, Dices, Music, Clapperboard } from "lucide-react";
import { AssetManager } from "./AssetManager";
import { DiceRoller } from "./DiceRoller";
import { Soundboard } from "./Soundboard";
import { CueManager } from "./CueManager";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mesaId: string;
  sessionId?: string | null;
  mesaTitle?: string;
  mesaSystem?: string;
}

export function GMSessionPanel({ open, onOpenChange, mesaId, sessionId, mesaTitle, mesaSystem }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="px-4 pt-4 pb-2 border-b border-border">
          <SheetTitle className="text-base flex items-center gap-2">
            <Clapperboard className="h-5 w-5 text-primary" />
            Painel de Sessão
          </SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="assets" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-4 mt-2 grid grid-cols-4 h-9">
            <TabsTrigger value="assets" className="text-xs gap-1">
              <Image className="h-3.5 w-3.5" /> Assets
            </TabsTrigger>
            <TabsTrigger value="dice" className="text-xs gap-1">
              <Dices className="h-3.5 w-3.5" /> Dados
            </TabsTrigger>
            <TabsTrigger value="audio" className="text-xs gap-1">
              <Music className="h-3.5 w-3.5" /> Áudio
            </TabsTrigger>
            <TabsTrigger value="cues" className="text-xs gap-1">
              <Clapperboard className="h-3.5 w-3.5" /> Cues
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-auto px-4 py-3">
            <TabsContent value="assets" className="mt-0">
              <AssetManager mesaId={mesaId} sessionId={sessionId} mesaTitle={mesaTitle} mesaSystem={mesaSystem} />
            </TabsContent>
            <TabsContent value="dice" className="mt-0">
              <DiceRoller mesaId={mesaId} sessionId={sessionId} />
            </TabsContent>
            <TabsContent value="audio" className="mt-0">
              <Soundboard mesaId={mesaId} sessionId={sessionId} />
            </TabsContent>
            <TabsContent value="cues" className="mt-0">
              <CueManager mesaId={mesaId} sessionId={sessionId} />
            </TabsContent>
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
