import { NumberField } from "@base-ui/react/number-field";
import { Slider } from "@base-ui/react/slider";
import { Switch } from "@base-ui/react/switch";
import {
  useEffect,
  useId,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { SETTING_LIMITS, serializeAsciiSettings, type AsciiSettings } from "@kusuromi/ascii-shader-core";
import { formatJsonSnippet, formatReactSnippet } from "./codeSnippet";
import { PackageIcon } from "./CodeIcons";
import { Dropdown } from "./Dropdown";
import { highlightCode } from "./highlight";

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

type SwitchRowProps = {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
};

function SwitchRow({ label, checked, disabled = false, onCheckedChange }: SwitchRowProps) {
  const switchId = useId();

  return (
    <div className="ascii-controls__row">
      <label
        htmlFor={switchId}
        className={`ascii-controls__label${disabled ? " ascii-controls__label--disabled" : ""}`}
      >
        {label}
      </label>
      <div className="ascii-controls__switch-cell">
        <Switch.Root
          id={switchId}
          checked={checked}
          disabled={disabled}
          onCheckedChange={onCheckedChange}
          className="ascii-switch"
        >
          <Switch.Thumb className="ascii-switch__thumb" />
        </Switch.Root>
      </div>
    </div>
  );
}

type IconProps = { className?: string };

function PlusIcon({ className }: IconProps) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M6 13V8H1C0.447715 8 0 7.55228 0 7C0 6.44772 0.447715 6 1 6H6V1C6 0.447715 6.44772 0 7 0C7.55228 0 8 0.447715 8 1V6H13C13.5523 6 14 6.44772 14 7C14 7.55228 13.5523 8 13 8H8V13C8 13.5523 7.55228 14 7 14C6.44772 14 6 13.5523 6 13Z" fill="currentColor" />
    </svg>
  );
}

function MinusIcon({ className }: IconProps) {
  return (
    <svg className={className} width="14" height="2" viewBox="0 0 14 2" fill="none" aria-hidden="true">
      <path d="M13 0C13.5523 0 14 0.447715 14 1C14 1.55228 13.5523 2 13 2H1C0.447715 2 0 1.55228 0 1C0 0.447715 0.447715 0 1 0H13Z" fill="currentColor" />
    </svg>
  );
}

function ResetIcon({ className }: IconProps) {
  return (
    <svg className={className} width="14" height="13" viewBox="0 0 14 13" fill="none" aria-hidden="true">
      <path d="M6.73668 0.063436C8.10542 -0.132861 9.50001 0.129188 10.7097 0.810952C11.9194 1.49274 12.8784 2.55748 13.4433 3.84358C14.0082 5.12966 14.1477 6.56784 13.8411 7.94185C13.5344 9.31582 12.7983 10.5511 11.7432 11.4614C10.6881 12.3716 9.37131 12.9082 7.99143 12.9893C6.61159 13.0702 5.24299 12.6916 4.0924 11.9109C2.94174 11.1301 2.07079 9.98863 1.61147 8.65949C1.47397 8.26123 1.67937 7.82453 2.07001 7.68421C2.46063 7.5441 2.88902 7.75347 3.02664 8.15169C3.37789 9.16795 4.04324 10.0406 4.92304 10.6377C5.80296 11.2348 6.84972 11.524 7.905 11.4621C8.96025 11.4002 9.96726 10.9903 10.7741 10.2942C11.581 9.59808 12.1445 8.65356 12.379 7.60282C12.6136 6.55209 12.5063 5.45212 12.0743 4.46863C11.6424 3.48518 10.9088 2.67128 9.9838 2.14991C9.05871 1.62854 7.99216 1.42775 6.94544 1.57788C5.89876 1.72804 4.92834 2.22122 4.1803 2.98256C4.17505 2.9879 4.1696 2.99305 4.16419 2.99824L2.64428 4.45444H4.5004C4.91456 4.45444 5.25032 4.79693 5.25047 5.21913C5.25047 5.64146 4.91465 5.98382 4.5004 5.98382H0.750067C0.335816 5.98382 0 5.64146 0 5.21913V1.39567C0.000147734 0.973473 0.335907 0.630981 0.750067 0.630981C1.16423 0.630981 1.49999 0.973473 1.50013 1.39567V3.45153L3.13651 1.88406C4.11258 0.897572 5.37528 0.258713 6.73668 0.063436Z" fill="currentColor" />
    </svg>
  );
}

function CopyIcon({ className }: IconProps) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M12.4444 6.37778C12.4444 6.12005 12.2355 5.91111 11.9778 5.91111H6.37778C6.12005 5.91111 5.91111 6.12005 5.91111 6.37778V11.9778C5.91111 12.2355 6.12005 12.4444 6.37778 12.4444H11.9778C12.2355 12.4444 12.4444 12.2355 12.4444 11.9778V6.37778ZM8.08889 2.64444V2.02222C8.08889 1.89846 8.03969 1.77979 7.95217 1.69227C7.86465 1.60476 7.74599 1.55556 7.62222 1.55556H2.02222C1.89845 1.55556 1.77979 1.60476 1.69227 1.69227C1.60476 1.77979 1.55556 1.89845 1.55556 2.02222V7.62222C1.55556 7.74599 1.60476 7.86465 1.69227 7.95217C1.77979 8.03969 1.89846 8.08889 2.02222 8.08889H2.64444C3.074 8.08889 3.42222 8.43711 3.42222 8.86667C3.42222 9.29622 3.074 9.64444 2.64444 9.64444H2.02222C1.4859 9.64444 0.971688 9.43124 0.592448 9.052C0.213208 8.67276 0 8.15855 0 7.62222V2.02222C0 1.4859 0.213208 0.971688 0.592448 0.592448C0.971688 0.213208 1.4859 0 2.02222 0H7.62222C8.15855 0 8.67276 0.213208 9.052 0.592448C9.43124 0.971688 9.64444 1.4859 9.64444 2.02222V2.64444C9.64444 3.074 9.29622 3.42222 8.86667 3.42222C8.43711 3.42222 8.08889 3.074 8.08889 2.64444ZM14 11.9778C14 13.0946 13.0946 14 11.9778 14H6.37778C5.26094 14 4.35556 13.0946 4.35556 11.9778V6.37778C4.35556 5.26094 5.26094 4.35556 6.37778 4.35556H11.9778C13.0946 4.35556 14 5.26094 14 6.37778V11.9778Z" fill="currentColor" />
    </svg>
  );
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the selection-based copy below.
  }

  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  const copied = document.execCommand("copy");
  area.remove();
  return copied;
}

type CodeFormat = "react" | "json";
const CODE_FORMAT_OPTIONS = [
  { value: "react", label: "React" },
  { value: "json", label: "JSON" },
] as const;
type PackageManager = "npm" | "pnpm" | "yarn" | "bun";

const PACKAGE_NAME = "@kusuromi/ascii-shader-react";
const INSTALL_COMMANDS: Record<PackageManager, string> = {
  npm: `npm install ${PACKAGE_NAME}`,
  pnpm: `pnpm add ${PACKAGE_NAME}`,
  yarn: `yarn add ${PACKAGE_NAME}`,
  bun: `bun add ${PACKAGE_NAME}`,
};

const NARROW_SCREEN_QUERY = "(max-width: 697px)";

export function AsciiControls({
  value,
  onValueChange,
  onReset,
  className = "",
  style,
}: AsciiControlsProps) {
  const [codeOpen, setCodeOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [codeFormat, setCodeFormat] = useState<CodeFormat>("react");
  const [packageManager, setPackageManager] = useState<PackageManager>("npm");
  const [copiedKey, setCopiedKey] = useState<"code" | "install" | null>(null);
  const isNarrowScreen = () => window.matchMedia(NARROW_SCREEN_QUERY).matches;
  const openCode = () => {
    setCodeOpen(true);
    if (isNarrowScreen()) setSettingsOpen(false);
  };
  const openSettings = () => {
    setSettingsOpen(true);
    if (isNarrowScreen()) setCodeOpen(false);
  };
  const cursorSwitchId = useId();
  const rippleSwitchId = useId();
  const vignetteSwitchId = useId();

  const update = <K extends keyof AsciiSettings>(key: K, nextValue: AsciiSettings[K]) => {
    onValueChange({ ...value, [key]: nextValue });
  };

  const updateCursor = <K extends keyof AsciiSettings["cursor"]>(
    key: K,
    nextValue: AsciiSettings["cursor"][K],
  ) => {
    onValueChange({ ...value, cursor: { ...value.cursor, [key]: nextValue } });
  };

  const updateRipple = <K extends keyof AsciiSettings["ripple"]>(
    key: K,
    nextValue: AsciiSettings["ripple"][K],
  ) => {
    onValueChange({ ...value, ripple: { ...value.ripple, [key]: nextValue } });
  };

  const updateVignette = <K extends keyof AsciiSettings["vignette"]>(
    key: K,
    nextValue: AsciiSettings["vignette"][K],
  ) => {
    onValueChange({ ...value, vignette: { ...value.vignette, [key]: nextValue } });
  };

  const updateVignetteSide = (side: keyof AsciiSettings["vignette"]["sides"], checked: boolean) => {
    onValueChange({
      ...value,
      vignette: { ...value.vignette, sides: { ...value.vignette.sides, [side]: checked } },
    });
  };

  const codeText = useMemo(() => {
    const changes = serializeAsciiSettings(value);
    return codeFormat === "react" ? formatReactSnippet(changes) : formatJsonSnippet(changes);
  }, [value, codeFormat]);

  const codeHighlight = useMemo(() => highlightCode(codeText), [codeText]);

  useEffect(() => {
    if (!copiedKey) return;
    const timer = window.setTimeout(() => setCopiedKey(null), 1500);
    return () => window.clearTimeout(timer);
  }, [copiedKey]);

  const copyWith = async (key: "code" | "install", text: string) => {
    if (await copyText(text)) setCopiedKey(key);
  };

  const codeFile =
    codeFormat === "react"
      ? { name: "AsciiBackground.tsx", tag: "WebGL · GLSL" }
      : { name: "settings.json", tag: "Settings" };

  const codeBar = (
    <div className="ascii-controls__collapsed">
      <span className="ascii-controls__collapsed-title">{copiedKey === "code" ? "COPIED" : "CODE"}</span>
      <div className="ascii-controls__collapsed-actions">
        <button
          type="button"
          onClick={() => copyWith("code", codeText)}
          className="ascii-controls__icon-button"
          aria-label="Copy code"
          title="Copy code"
        >
          <CopyIcon className="ascii-controls__icon--copy" />
        </button>
        <button
          type="button"
          onClick={openCode}
          className="ascii-controls__icon-button ascii-controls__expand-button"
          aria-label="Open code"
          title="Open code"
        >
          <PlusIcon className="ascii-controls__icon--plus" />
        </button>
      </div>
    </div>
  );

  const copiedBadge = (key: "code" | "install") =>
    copiedKey === key ? <span className="ascii-controls__copied">Copied</span> : null;

  const codePanel = (
    <aside className="ascii-controls ascii-controls--code" aria-label="ASCII shader code">
      <div className="ascii-controls__header">
        <span className="ascii-controls__title">CODE</span>

        <button
          type="button"
          onClick={() => setCodeOpen(false)}
          className="ascii-controls__icon-button"
          aria-label="Close code"
          title="Close code"
        >
          <MinusIcon className="ascii-controls__icon--minus" />
        </button>
      </div>

      <div className="ascii-controls__content">
        <section className="ascii-controls__card" aria-label="Install">
          <div className="ascii-controls__card-head">
            <div className="ascii-controls__tabs" role="group" aria-label="Package manager">
              {(["npm", "pnpm", "yarn", "bun"] as const).map((manager) => (
                <button
                  key={manager}
                  type="button"
                  aria-pressed={packageManager === manager}
                  onClick={() => setPackageManager(manager)}
                  className={`ascii-controls__tab${packageManager === manager ? " ascii-controls__tab--active" : ""}`}
                >
                  <PackageIcon manager={manager} />
                  <span>{manager}</span>
                </button>
              ))}
            </div>
            {copiedBadge("install")}
            <button
              type="button"
              onClick={() => copyWith("install", INSTALL_COMMANDS[packageManager])}
              className="ascii-controls__icon-button"
              aria-label="Copy install command"
              title="Copy install command"
            >
              <CopyIcon className="ascii-controls__icon--copy" />
            </button>
          </div>
          <div className="ascii-controls__card-body">
            <pre className="ascii-controls__code">
              <code>{INSTALL_COMMANDS[packageManager]}</code>
            </pre>
          </div>
        </section>

        <section className="ascii-controls__card" aria-label="Code">
          <div className="ascii-controls__card-head">
            <Dropdown
              label="Code format"
              value={codeFormat}
              options={CODE_FORMAT_OPTIONS}
              onChange={setCodeFormat}
            />
            {copiedBadge("code")}
            <button
              type="button"
              onClick={() => copyWith("code", codeText)}
              className="ascii-controls__icon-button"
              aria-label="Copy code"
              title="Copy code"
            >
              <CopyIcon className="ascii-controls__icon--copy" />
            </button>
          </div>
          <div className="ascii-controls__card-file">
            <span className="ascii-controls__code-name">{codeFile.name}</span>
            <span className="ascii-controls__code-tag">{codeFile.tag}</span>
          </div>
          <div className="ascii-controls__card-body">
            <pre className="ascii-controls__code">
              <code>{codeHighlight}</code>
            </pre>
          </div>
        </section>
      </div>
    </aside>
  );

  const settingsBar = (
    <div className="ascii-controls__collapsed">
      <span className="ascii-controls__collapsed-title">SETTINGS</span>
      <div className="ascii-controls__collapsed-actions">
        {onReset ? (
          <button
            type="button"
            onClick={onReset}
            className="ascii-controls__icon-button"
            aria-label="Reset settings"
            title="Reset settings"
          >
            <ResetIcon className="ascii-controls__icon--reset" />
          </button>
        ) : null}
        <button
          type="button"
          onClick={openSettings}
          className="ascii-controls__icon-button ascii-controls__expand-button"
          aria-label="Open ASCII settings"
          title="Open settings"
        >
          <PlusIcon className="ascii-controls__icon--plus" />
        </button>
      </div>
    </div>
  );

  const settingsPanel = (
    <aside className="ascii-controls" aria-label="ASCII shader settings">
      <div className="ascii-controls__header">
        <span className="ascii-controls__title">SETTINGS</span>
        <div className="ascii-controls__collapsed-actions">
          {onReset ? (
            <button
              type="button"
              onClick={onReset}
              className="ascii-controls__icon-button"
              aria-label="Reset settings"
              title="Reset settings"
            >
              <ResetIcon className="ascii-controls__icon--reset" />
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => setSettingsOpen(false)}
            className="ascii-controls__icon-button"
            aria-label="Close settings"
            title="Close settings"
          >
            <MinusIcon className="ascii-controls__icon--minus" />
          </button>
        </div>
      </div>

      <div className="ascii-controls__content">
        <section className="ascii-controls__group" aria-label="Cursor settings">
          <GroupLabel>Cursor</GroupLabel>

          <div className="ascii-controls__row">
            <label
              htmlFor={cursorSwitchId}
              className={`ascii-controls__label${value.cursor.enabled ? "" : " ascii-controls__label--disabled"}`}
            >
              Enabled
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

        <section className="ascii-controls__group ascii-controls__group--separated" aria-label="Ripple settings">
          <GroupLabel>Ripple</GroupLabel>

          <div className="ascii-controls__row">
            <label
              htmlFor={rippleSwitchId}
              className={`ascii-controls__label${value.ripple.enabled ? "" : " ascii-controls__label--disabled"}`}
            >
              Enabled
            </label>
            <div className="ascii-controls__switch-cell">
              <Switch.Root
                id={rippleSwitchId}
                checked={value.ripple.enabled}
                onCheckedChange={(checked) => updateRipple("enabled", checked)}
                className="ascii-switch"
              >
                <Switch.Thumb className="ascii-switch__thumb" />
              </Switch.Root>
            </div>
          </div>

          <div className="ascii-controls__range-list">
            <RangeControl
              label="Strength"
              description="Ripple intensity"
              value={value.ripple.strength}
              {...SETTING_LIMITS.rippleStrength}
              scaled
              unit="%"
              disabled={!value.ripple.enabled}
              onChange={(next) => updateRipple("strength", next)}
            />
            <RangeControl
              label="Speed"
              description="Ripple front speed (fraction of the shorter screen side per second)"
              value={value.ripple.speed}
              {...SETTING_LIMITS.rippleSpeed}
              scaled
              unit="%"
              disabled={!value.ripple.enabled}
              onChange={(next) => updateRipple("speed", next)}
            />
            <RangeControl
              label="Wave"
              description="Distance between wave crests"
              value={value.ripple.wavelength}
              {...SETTING_LIMITS.rippleWavelength}
              unit="px"
              disabled={!value.ripple.enabled}
              onChange={(next) => updateRipple("wavelength", next)}
            />
            <RangeControl
              label="Width"
              description="Width of the ring band"
              value={value.ripple.width}
              {...SETTING_LIMITS.rippleWidth}
              unit="px"
              disabled={!value.ripple.enabled}
              onChange={(next) => updateRipple("width", next)}
            />
            <RangeControl
              label="Decay"
              description="How quickly click ripples fade"
              value={value.ripple.decay}
              {...SETTING_LIMITS.rippleDecay}
              disabled={!value.ripple.enabled}
              onChange={(next) => updateRipple("decay", next)}
            />
          </div>
        </section>

        <section className="ascii-controls__group ascii-controls__group--separated" aria-label="Vignette settings">
          <GroupLabel>Vignette</GroupLabel>

          <div className="ascii-controls__row">
            <label
              htmlFor={vignetteSwitchId}
              className={`ascii-controls__label${value.vignette.enabled ? "" : " ascii-controls__label--disabled"}`}
            >
              Enabled
            </label>
            <div className="ascii-controls__switch-cell">
              <Switch.Root
                id={vignetteSwitchId}
                checked={value.vignette.enabled}
                onCheckedChange={(checked) => updateVignette("enabled", checked)}
                className="ascii-switch"
              >
                <Switch.Thumb className="ascii-switch__thumb" />
              </Switch.Root>
            </div>
          </div>

          <div className="ascii-controls__range-list">
            <RangeControl
              label="Radius"
              description="Width of the edge band (% of the shorter screen side)"
              value={value.vignette.radius}
              {...SETTING_LIMITS.vignetteRadius}
              unit="%"
              disabled={!value.vignette.enabled}
              onChange={(next) => updateVignette("radius", next)}
            />
            <RangeControl
              label="Edge"
              description="How dim the glyphs get at the very edge of the band"
              value={value.vignette.edgeLevel}
              {...SETTING_LIMITS.vignetteEdgeLevel}
              scaled
              unit="%"
              disabled={!value.vignette.enabled}
              onChange={(next) => updateVignette("edgeLevel", next)}
            />
          </div>

          <SwitchRow
            label="Top"
            checked={value.vignette.sides.top}
            disabled={!value.vignette.enabled}
            onCheckedChange={(checked) => updateVignetteSide("top", checked)}
          />
          <SwitchRow
            label="Right"
            checked={value.vignette.sides.right}
            disabled={!value.vignette.enabled}
            onCheckedChange={(checked) => updateVignetteSide("right", checked)}
          />
          <SwitchRow
            label="Bottom"
            checked={value.vignette.sides.bottom}
            disabled={!value.vignette.enabled}
            onCheckedChange={(checked) => updateVignetteSide("bottom", checked)}
          />
          <SwitchRow
            label="Left"
            checked={value.vignette.sides.left}
            disabled={!value.vignette.enabled}
            onCheckedChange={(checked) => updateVignetteSide("left", checked)}
          />
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

  return (
    <div
      className={`ascii-controls-dock${codeOpen || settingsOpen ? " ascii-controls-dock--open" : ""}${codeOpen && settingsOpen ? " ascii-controls-dock--both" : ""}${className ? ` ${className}` : ""}`}
      data-ascii-ignore-pointer
      style={style}
    >
      {codeOpen ? codePanel : codeBar}
      {settingsOpen ? settingsPanel : settingsBar}
    </div>
  );
}
