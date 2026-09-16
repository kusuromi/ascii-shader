import { NumberField } from "@base-ui/react/number-field";
import { Slider } from "@base-ui/react/slider";
import { Switch } from "@base-ui/react/switch";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { useId, useState, type CSSProperties, type ReactNode } from "react";
import { SETTING_LIMITS, type AsciiSettings } from "@ascii-background/core";

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
        className="ascii-number-field"
        value={value}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        format={{
          minimumFractionDigits: digits,
          maximumFractionDigits: digits,
          useGrouping: false,
        }}
        onValueChange={(nextValue) => {
          if (nextValue !== null && Number.isFinite(nextValue)) onChange(nextValue);
        }}
      >
        <NumberField.Input
          aria-label={`${label}: numeric value`}
          className="ascii-number-input"
        />
        <span className={`ascii-number-actions${disabled ? " ascii-number-actions--disabled" : ""}`}>
          <NumberField.Increment
            className="ascii-number-action ascii-number-action--increment"
            aria-label={`Increase ${label}`}
          >
            <svg
              className="ascii-number-action__icon"
              viewBox="0 0 12 8"
              aria-hidden="true"
            >
              <path
                d="M1.9 7.4 L10.1 7.4 Q11.4 7.4 10.591 6.382 L6.809 1.618 Q6 0.6 5.191 1.618 L1.409 6.382 Q0.6 7.4 1.9 7.4 Z"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinejoin="round"
              />
            </svg>
          </NumberField.Increment>
          <NumberField.Decrement
            className="ascii-number-action ascii-number-action--decrement"
            aria-label={`Decrease ${label}`}
          >
            <svg
              className="ascii-number-action__icon"
              viewBox="0 0 12 8"
              aria-hidden="true"
            >
              <path
                d="M1.9 0.6 L10.1 0.6 Q11.4 0.6 10.591 1.618 L6.809 6.382 Q6 7.4 5.191 6.382 L1.409 1.618 Q0.6 0.6 1.9 0.6 Z"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinejoin="round"
              />
            </svg>
          </NumberField.Decrement>
        </span>
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
      aria-label="ASCII background settings"
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
              disabled={!value.cursor.enabled}
              onChange={(next) => updateCursor("strength", next)}
            />
            <RangeControl
              label="Radius"
              description="Cursor influence radius (% of the shorter screen side)"
              value={value.cursor.radius}
              {...SETTING_LIMITS.cursorRadius}
              disabled={!value.cursor.enabled}
              onChange={(next) => updateCursor("radius", next)}
            />
            <RangeControl
              label="Follow"
              description="Pointer smoothing"
              value={value.cursor.follow}
              {...SETTING_LIMITS.cursorFollow}
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
              onChange={(next) => update("frequency", next)}
            />
            <RangeControl
              label="Speed"
              description="Animation speed"
              value={value.speed}
              {...SETTING_LIMITS.speed}
              onChange={(next) => update("speed", next)}
            />
            <RangeControl
              label="Lightness"
              description="Base luminance"
              value={value.lightness}
              {...SETTING_LIMITS.lightness}
              onChange={(next) => update("lightness", next)}
            />
            <RangeControl
              label="Contrast"
              description="Glyph separation"
              value={value.contrast}
              {...SETTING_LIMITS.contrast}
              onChange={(next) => update("contrast", next)}
            />
            <RangeControl
              label="Opacity"
              description="Layer opacity"
              value={value.opacity}
              {...SETTING_LIMITS.opacity}
              onChange={(next) => update("opacity", next)}
            />
            <RangeControl
              label="Cell"
              description="ASCII grid cell size"
              value={value.cellSize}
              {...SETTING_LIMITS.cellSize}
              onChange={(next) => update("cellSize", next)}
            />
            <RangeControl
              label="Glyphs"
              description="Number of glyph levels"
              value={value.glyphCount}
              {...SETTING_LIMITS.glyphCount}
              onChange={(next) => update("glyphCount", next)}
            />
          </div>
        </section>
      </div>
    </aside>
  );
}
