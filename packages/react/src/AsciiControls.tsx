import { NumberField } from "@base-ui/react/number-field";
import { Slider } from "@base-ui/react/slider";
import { Switch } from "@base-ui/react/switch";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { useId, useState, type CSSProperties, type ReactNode } from "react";
import { SETTING_LIMITS, type AsciiSettings } from "@ascii-shader/core";

export type AsciiControlsProps = {
  value: AsciiSettings;
  onValueChange: (value: AsciiSettings) => void;
  onReset?: () => void;
  className?: string;
  style?: CSSProperties;
};

type RangeControlProps = {
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  step: number;
  digits: number;
  unit?: "%" | "px" | "pc" | "pt";
  scaled?: boolean;
  disabled?: boolean;
  onChange: (value: number) => void;
};

function RangeControl({
  label,
  description,
  value,
  min,
  max,
  step,
  digits,
  unit,
  scaled = false,
  disabled = false,
  onChange,
}: RangeControlProps) {
  const labelId = useId();
  const descriptionId = useId();

  return (
    <div className="ascii-controls__row">
      <label
        id={labelId}
        title={description}
        className={`ascii-controls__label${disabled ? " ascii-controls__label--disabled" : ""}`}
      >
        {label}
      </label>

      <span id={descriptionId} className="ascii-sr-only">
        {description}
      </span>

      <Slider.Root
        aria-labelledby={labelId}
        aria-describedby={descriptionId}
        value={value}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onValueChange={(nextValue) =>
          onChange(Array.isArray(nextValue) ? nextValue[0] : nextValue)
        }
        className="ascii-slider"
      >
        <Slider.Control className="ascii-slider__control">
          <Slider.Track className="ascii-slider__track">
            <Slider.Indicator className="ascii-slider__indicator" />
            <Slider.Thumb
              className="ascii-slider__thumb"
              style={{ "--thumb-percent": `${((value - min) / (max - min)) * 100}%` } as CSSProperties}
            />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>

      <NumberField.Root
        className={`ascii-number-field${disabled ? " ascii-number-field--disabled" : ""}`}
        value={scaled ? Math.min(100, Math.max(0, Math.round(((value - min) / (max - min)) * 100))) : value}
        min={scaled ? 0 : min}
        max={scaled ? 100 : max}
        step={scaled ? 1 : step}
        disabled={disabled}
        format={{
          minimumFractionDigits: scaled ? 0 : digits,
          maximumFractionDigits: scaled ? 0 : digits,
          useGrouping: false,
        }}
        onValueChange={(nextValue) => {
          if (nextValue === null || !Number.isFinite(nextValue)) return;
          if (!scaled) {
            onChange(nextValue);
            return;
          }
          const percent = Math.min(100, Math.max(0, nextValue));
          const raw = min + (percent / 100) * (max - min);
          const factor = 10 ** digits;
          onChange(Math.min(max, Math.max(min, Math.round(raw * factor) / factor)));
        }}
      >
        <NumberField.Input
          aria-label={`${label}${scaled ? " percent" : ""} value`}
          className="ascii-number-input"
        />
        {unit ? <span className="ascii-number-suffix">{unit}</span> : null}
      </NumberField.Root>
    </div>
  );
}

function GroupLabel({ children }: { children: ReactNode }) {
  return <div className="ascii-controls__group-label">{children}</div>;
}

export function AsciiControls({
  value,
  onValueChange,
  onReset,
  className = "",
  style,
}: AsciiControlsProps) {
  const [panelOpen, setPanelOpen] = useState(true);
  const cursorSwitchId = useId();

  const update = <K extends keyof AsciiSettings>(key: K, nextValue: AsciiSettings[K]) => {
    onValueChange({ ...value, [key]: nextValue });
  };

  const updateCursor = <K extends keyof AsciiSettings["cursor"]>(
    key: K,
    nextValue: AsciiSettings["cursor"][K],
  ) => {
    onValueChange({ ...value, cursor: { ...value.cursor, [key]: nextValue } });
  };

  if (!panelOpen) {
    return (
      <div
        className={`ascii-controls__collapsed ${className}`.trim()}
        style={style}
      >
        <span className="ascii-controls__collapsed-title">SETTINGS</span>
        {onReset ? (
          <button
            type="button"
            onClick={onReset}
            className="ascii-controls__icon-button"
            aria-label="Reset settings"
            title="Reset settings"
          >
            <RotateCcw className="ascii-controls__icon--reset" aria-hidden="true" />
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setPanelOpen(true)}
          className="ascii-controls__icon-button ascii-controls__expand-button"
          aria-label="Open ASCII settings"
          title="Open settings"
        >
          <Plus className="ascii-controls__icon--plus" aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <aside
      className={`ascii-controls ${className}`.trim()}
      style={style}
      aria-label="ASCII shader settings"
    >
      <div className="ascii-controls__header">
        <span className="ascii-controls__title">SETTINGS</span>
        {onReset ? (
          <button
            type="button"
            onClick={onReset}
            className="ascii-controls__icon-button"
            aria-label="Reset settings"
            title="Reset settings"
          >
            <RotateCcw className="ascii-controls__icon--reset" aria-hidden="true" />
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => setPanelOpen(false)}
          className="ascii-controls__icon-button"
          aria-label="Close settings"
          title="Close settings"
        >
          <Minus className="ascii-controls__icon--minus" aria-hidden="true" />
        </button>
      </div>

      <div className="ascii-controls__content">
        <section className="ascii-controls__group" aria-label="Cursor settings">
          <GroupLabel>Cursor</GroupLabel>

          <div className="ascii-controls__row">
            <label
              htmlFor={cursorSwitchId}
              className={`ascii-controls__label${value.cursor.enabled ? "" : " ascii-controls__label--disabled"}`}
            >
              Interactive
            </label>
            <div className="ascii-controls__switch-cell">
              <Switch.Root
                id={cursorSwitchId}
                checked={value.cursor.enabled}
                onCheckedChange={(checked) => updateCursor("enabled", checked)}
                className="ascii-switch"
              >
                <Switch.Thumb className="ascii-switch__thumb" />
              </Switch.Root>
            </div>
          </div>

          <div className="ascii-controls__range-list">
            <RangeControl
              label="Strength"
              description="Pointer interaction intensity"
              value={value.cursor.strength}
              {...SETTING_LIMITS.cursorStrength}
              scaled
              unit="%"
              disabled={!value.cursor.enabled}
              onChange={(next) => updateCursor("strength", next)}
            />
            <RangeControl
              label="Radius"
              description="Cursor influence radius (% of the shorter screen side)"
              value={value.cursor.radius}
              {...SETTING_LIMITS.cursorRadius}
              unit="%"
              disabled={!value.cursor.enabled}
              onChange={(next) => updateCursor("radius", next)}
            />
            <RangeControl
              label="Follow"
              description="Pointer smoothing"
              value={value.cursor.follow}
              {...SETTING_LIMITS.cursorFollow}
              scaled
              unit="%"
              disabled={!value.cursor.enabled}
              onChange={(next) => updateCursor("follow", next)}
            />
          </div>
        </section>

        <section className="ascii-controls__group ascii-controls__group--separated" aria-label="Field settings">
          <GroupLabel>Background</GroupLabel>

          <div className="ascii-controls__range-list">
            <RangeControl
              label="Frequency"
              description="Noise frequency"
              value={value.frequency}
              {...SETTING_LIMITS.frequency}
              scaled
              unit="%"
              onChange={(next) => update("frequency", next)}
            />
            <RangeControl
              label="Speed"
              description="Animation speed"
              value={value.speed}
              {...SETTING_LIMITS.speed}
              scaled
              unit="%"
              onChange={(next) => update("speed", next)}
            />
            <RangeControl
              label="Lightness"
              description="Base luminance"
              value={value.lightness}
              {...SETTING_LIMITS.lightness}
              scaled
              unit="%"
              onChange={(next) => update("lightness", next)}
            />
            <RangeControl
              label="Contrast"
              description="Glyph separation"
              value={value.contrast}
              {...SETTING_LIMITS.contrast}
              scaled
              unit="%"
              onChange={(next) => update("contrast", next)}
            />
            <RangeControl
              label="Opacity"
              description="Layer opacity"
              value={value.opacity}
              {...SETTING_LIMITS.opacity}
              scaled
              unit="%"
              onChange={(next) => update("opacity", next)}
            />
            <RangeControl
              label="Cell"
              description="ASCII grid cell size"
              value={value.cellSize}
              {...SETTING_LIMITS.cellSize}
              unit="px"
              onChange={(next) => update("cellSize", next)}
            />
            <RangeControl
              label="Glyphs"
              description="Number of glyph levels"
              value={value.glyphCount}
              unit="pt"
              {...SETTING_LIMITS.glyphCount}
              onChange={(next) => update("glyphCount", next)}
            />
          </div>
        </section>
      </div>
    </aside>
  );
}
