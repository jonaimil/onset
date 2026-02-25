"use client";

import { useRef } from "react";
import { useTrainerStore } from "@/store/trainer-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Sparkles, AlertCircle } from "lucide-react";

export function TrainingConfig() {
  const profileName = useTrainerStore((s) => s.profileName);
  const setProfileName = useTrainerStore((s) => s.setProfileName);
  const triggerWord = useTrainerStore((s) => s.triggerWord);
  const setTriggerWord = useTrainerStore((s) => s.setTriggerWord);
  const getSelectedCount = useTrainerStore((s) => s.getSelectedCount);
  const startTraining = useTrainerStore((s) => s.startTraining);
  const trainingError = useTrainerStore((s) => s.trainingError);
  const setPhase = useTrainerStore((s) => s.setPhase);

  // Track whether the user has manually edited the trigger word
  const triggerManuallyEdited = useRef(false);

  const selectedCount = getSelectedCount();

  const handleProfileNameChange = (value: string) => {
    setProfileName(value);
    if (!triggerManuallyEdited.current) {
      setTriggerWord(value);
    }
  };

  const handleTriggerWordChange = (value: string) => {
    triggerManuallyEdited.current = true;
    setTriggerWord(value);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Configure Training</h2>
        <p className="text-sm text-muted-foreground">
          Set a name and trigger word for your LoRA, then start training.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            Training Dataset
            <Badge variant="secondary">{selectedCount} images</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profile-name">Profile Name</Label>
            <Input
              id="profile-name"
              placeholder="e.g., Character A, Warrior Princess"
              value={profileName}
              onChange={(e) => handleProfileNameChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              A name to identify this trained LoRA in your profiles.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="trigger-word">Trigger Word</Label>
            <Input
              id="trigger-word"
              placeholder="Same as profile name"
              value={triggerWord}
              onChange={(e) => handleTriggerWordChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              A unique word that activates the LoRA in prompts. Use it like:{" "}
              <code className="rounded bg-muted px-1">
                a photo of {triggerWord || "TRIGGER"} person on a beach
              </code>
            </p>
          </div>
        </CardContent>
      </Card>

      {trainingError && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-red-200">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {trainingError}
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setPhase("review")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Review
        </Button>
        <Button
          onClick={startTraining}
          disabled={!profileName.trim() || !triggerWord.trim()}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Start Training
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Training typically takes 4-8 minutes and costs ~$2. The model will
        auto-caption your images and create face masks for optimal training.
      </p>
    </div>
  );
}
