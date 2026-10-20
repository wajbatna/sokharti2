"use client";

import { useState } from "react";
import { Crosshair, MapPin } from "lucide-react";
import { Button, Field, Input, Select, Sheet } from "@/components/ui";
import { useLocation } from "@/components/providers";
import { CITIES } from "@/lib/utils";

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  برشيد: { lat: 33.2667, lng: -7.5869 },
  "الدار البيضاء": { lat: 33.5731, lng: -7.5898 },
  سطات: { lat: 33.0011, lng: -7.6166 },
  المحمدية: { lat: 33.6861, lng: -7.383 },
  بنسليمان: { lat: 33.6186, lng: -7.1214 },
  الجديدة: { lat: 33.2316, lng: -8.5007 },
  الرباط: { lat: 34.0209, lng: -6.8416 },
  مراكش: { lat: 31.6295, lng: -7.9811 },
};

export function LocationModal() {
  const { pickerOpen, closePicker, setLocation, location } = useLocation();
  const [city, setCity] = useState(location?.city ?? "برشيد");
  const [address, setAddress] = useState(location?.address ?? "");
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");

  const useMyLocation = () => {
    setError("");
    if (!navigator.geolocation) {
      setError("المتصفح ما كيدعمش تحديد الموقع");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        let nearest = "برشيد";
        let best = Number.POSITIVE_INFINITY;
        Object.entries(CITY_COORDS).forEach(([name, c]) => {
          const d = (c.lat - latitude) ** 2 + (c.lng - longitude) ** 2;
          if (d < best) {
            best = d;
            nearest = name;
          }
        });
        setLocating(false);
        setLocation({ city: nearest, address: "موقعي الحالي", lat: latitude, lng: longitude });
      },
      () => {
        setLocating(false);
        setError("ما قدرناش نحددو موقعك، دخل العنوان يدوياً");
      },
      { timeout: 8000 },
    );
  };

  const save = () => {
    if (address.trim().length < 4) {
      setError("دخل عنوان مفصل (الحي، الزنقة، الرقم)");
      return;
    }
    setLocation({ city, address: address.trim(), ...CITY_COORDS[city] });
  };

  return (
    <Sheet open={pickerOpen} onClose={closePicker} side="bottom" label="اختيار العنوان">
      <div className="space-y-5 p-6 pt-8">
        <div className="text-center">
          <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF1EB] text-[#FF6B35]">
            <MapPin className="h-7 w-7" />
          </span>
          <h2 className="text-xl font-extrabold text-[#111827]">فين بغيتي نوصلو ليك؟</h2>
          <p className="mt-1 text-sm text-gray-500">حدد عنوانك باش نبينو ليك المحلات لي كتوصل لعندك</p>
        </div>

        <Button variant="secondary" size="lg" className="w-full" onClick={useMyLocation} loading={locating}>
          <Crosshair className="h-4.5 w-4.5" /> استخدم موقعي
        </Button>

        <div className="flex items-center gap-3 text-xs font-bold text-gray-400">
          <span className="h-px flex-1 bg-gray-200" /> أو أدخل العنوان يدوياً <span className="h-px flex-1 bg-gray-200" />
        </div>

        <Field label="المدينة">
          <Select value={city} onChange={(e) => setCity(e.target.value)}>
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="العنوان">
          <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="مثال: حي النهضة، زنقة 12، رقم 34" />
        </Field>

        {error ? <p className="rounded-2xl bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600">{error}</p> : null}

        <Button size="lg" className="w-full" onClick={save}>
          حفظ العنوان ومتابعة
        </Button>
      </div>
    </Sheet>
  );
}
