"use client";

import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle, CardDescription } from "@repo/ui";
import { useState } from "react";
import { useRouter } from "next/navigation";




import { Save, Loader2 } from "lucide-react";

interface Props {
  initialSettings: Record<string, string>;
}

export function SettingsClient({ initialSettings }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [commissionRate, setCommissionRate] = useState(
    initialSettings["default_author_commission_rate"] || "0.70"
  );
  const [platformFee, setPlatformFee] = useState(
    initialSettings["platform_fee_percentage"] || "0.30"
  );
  const [minBookPrice, setMinBookPrice] = useState(
    initialSettings["min_book_price"]
      ? String(Number(initialSettings["min_book_price"]) / 100)
      : "500"
  );
  const [maxUploadSize, setMaxUploadSize] = useState(
    initialSettings["max_upload_size_mb"] || "500"
  );
  const [audioFormats, setAudioFormats] = useState(
    initialSettings["supported_audio_formats"] || '["mp3","aac","m4a","m4b"]'
  );
  const [ebookFormats, setEbookFormats] = useState(
    initialSettings["supported_ebook_formats"] || '["epub","pdf"]'
  );

  async function handleSave() {
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            default_author_commission_rate: commissionRate,
            platform_fee_percentage: platformFee,
            min_book_price: String(Math.round(parseFloat(minBookPrice) * 100)),
            max_upload_size_mb: maxUploadSize,
            supported_audio_formats: audioFormats,
            supported_ebook_formats: ebookFormats,
          },
        }),
      });

      if (res.ok) {
        setSaved(true);
        router.refresh();
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Commission Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Commission Settings</CardTitle>
          <CardDescription>
            Configure the default commission split between authors and the platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="commissionRate">
                Author Commission Rate (0-1)
              </Label>
              <Input
                id="commissionRate"
                type="number"
                min="0"
                max="1"
                step="0.05"
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
                placeholder="0.70"
              />
              <p className="text-xs text-muted-foreground">
                Authors receive {(parseFloat(commissionRate || "0") * 100).toFixed(0)}% of each sale
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="platformFee">
                Platform Fee Percentage (0-1)
              </Label>
              <Input
                id="platformFee"
                type="number"
                min="0"
                max="1"
                step="0.05"
                value={platformFee}
                onChange={(e) => setPlatformFee(e.target.value)}
                placeholder="0.30"
              />
              <p className="text-xs text-muted-foreground">
                Platform keeps {(parseFloat(platformFee || "0") * 100).toFixed(0)}% of each sale
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
          <CardDescription>
            Set minimum pricing for books on the platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="minBookPrice">Minimum Book Price (Naira)</Label>
            <Input
              id="minBookPrice"
              type="number"
              min="0"
              step="100"
              value={minBookPrice}
              onChange={(e) => setMinBookPrice(e.target.value)}
              placeholder="500"
            />
            <p className="text-xs text-muted-foreground">
              Stored as {Math.round(parseFloat(minBookPrice || "0") * 100)} kobo
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Upload Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Settings</CardTitle>
          <CardDescription>
            Configure file upload limits and supported formats.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="maxUploadSize">Maximum Upload Size (MB)</Label>
            <Input
              id="maxUploadSize"
              type="number"
              min="1"
              value={maxUploadSize}
              onChange={(e) => setMaxUploadSize(e.target.value)}
              placeholder="500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="audioFormats">
              Supported Audio Formats (JSON array)
            </Label>
            <Input
              id="audioFormats"
              value={audioFormats}
              onChange={(e) => setAudioFormats(e.target.value)}
              placeholder='["mp3","aac","m4a","m4b"]'
            />
            <p className="text-xs text-muted-foreground">
              Enter as JSON array, e.g. [&quot;mp3&quot;,&quot;aac&quot;]
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ebookFormats">
              Supported Ebook Formats (JSON array)
            </Label>
            <Input
              id="ebookFormats"
              value={ebookFormats}
              onChange={(e) => setEbookFormats(e.target.value)}
              placeholder='["epub","pdf"]'
            />
            <p className="text-xs text-muted-foreground">
              Enter as JSON array, e.g. [&quot;epub&quot;,&quot;pdf&quot;]
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving} className="min-w-[120px]">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
        {saved && (
          <span className="text-sm font-medium text-green-600">
            Settings saved successfully!
          </span>
        )}
      </div>
    </div>
  );
}
