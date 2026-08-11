import {
  type ChangeEvent,
  type FormEvent,
  useState,
} from "react";
import type { IconType } from "react-icons";
import { API_BASE, apiFetch } from "../../lib/apiClient";
import { BanknotesIcon, CurrencyDollarIcon, DocumentTextIcon } from "../icons";

export type PackageKind = "saving" | "fixed" | "loan";

type FieldName =
  | "name"
  | "interestRate"
  | "description"
  | "minBalance"
  | "minDuration"
  | "minAmount"
  | "maxDuration"
  | "maxAmount"
  | "interestBasis"
  | "capitalizationFrequency"
  | "dayCountConvention";

interface FieldDefinition {
  name: FieldName;
  label: string;
  placeholder: string;
  type?: "text" | "number" | "select";
  step?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
}

interface PackageConfiguration {
  endpoint: string;
  createLabel: string;
  icon: IconType;
  fields: FieldDefinition[];
}

const COMMON_FIELDS: FieldDefinition[] = [
  { name: "name", label: "Package Name", placeholder: "Enter package name", required: true },
  {
    name: "interestRate",
    label: "Interest Rate (%)",
    placeholder: "e.g., 8.5",
    type: "number",
    step: "0.01",
    required: true,
  },
];

const CONFIG: Record<PackageKind, PackageConfiguration> = {
  saving: {
    endpoint: "saving-accounts",
    createLabel: "Saving Account",
    icon: CurrencyDollarIcon,
    fields: [
      ...COMMON_FIELDS,
      {
        name: "minBalance",
        label: "Minimum Balance",
        placeholder: "e.g., 5000",
        type: "number",
        step: "0.01",
        required: true,
      },
      { name: "interestBasis", label: "Calculation Basis", placeholder: "", type: "select", required: true,
        options: [
          { value: "DAILY_PRODUCT", label: "Daily product" },
          { value: "MINIMUM_MONTHLY_BALANCE", label: "Minimum monthly balance" },
          { value: "AVERAGE_BALANCE", label: "Average balance" },
        ] },
      { name: "capitalizationFrequency", label: "Capitalization Frequency", placeholder: "", type: "select", required: true,
        options: [
          { value: "DAILY", label: "Daily" }, { value: "MONTHLY", label: "Monthly" },
          { value: "QUARTERLY", label: "Quarterly" }, { value: "ANNUALLY", label: "Annually (fiscal year)" },
        ] },
      { name: "dayCountConvention", label: "Day-count Convention", placeholder: "", type: "select", required: true,
        options: [
          { value: "ACTUAL_365", label: "Actual / 365" }, { value: "ACTUAL_366", label: "Actual / 365 or 366" },
          { value: "THIRTY_360", label: "30 / 360" },
        ] },
    ],
  },
  fixed: {
    endpoint: "fixed-deposits",
    createLabel: "Fixed Deposit",
    icon: DocumentTextIcon,
    fields: [
      ...COMMON_FIELDS,
      {
        name: "minDuration",
        label: "Minimum Duration (months)",
        placeholder: "e.g., 12",
        type: "number",
        required: true,
      },
      {
        name: "minAmount",
        label: "Minimum Amount",
        placeholder: "e.g., 10000",
        type: "number",
        step: "0.01",
        required: true,
      },
    ],
  },
  loan: {
    endpoint: "loan-packages",
    createLabel: "Loan Package",
    icon: BanknotesIcon,
    fields: [
      ...COMMON_FIELDS,
      {
        name: "maxDuration",
        label: "Maximum Duration (months)",
        placeholder: "e.g., 60",
        type: "number",
        required: true,
      },
      {
        name: "maxAmount",
        label: "Maximum Amount",
        placeholder: "e.g., 500000",
        type: "number",
        step: "0.01",
        required: true,
      },
    ],
  },
};

type PackageValues = Record<FieldName, string>;

const EMPTY_VALUES: PackageValues = {
  name: "",
  interestRate: "",
  description: "",
  minBalance: "",
  minDuration: "",
  minAmount: "",
  maxDuration: "",
  maxAmount: "",
  interestBasis: "DAILY_PRODUCT",
  capitalizationFrequency: "MONTHLY",
  dayCountConvention: "ACTUAL_365",
};

export interface PackageInitialData {
  id: string | number;
  bannerData?: unknown;
  name?: string | number | null;
  interestRate?: string | number | null;
  description?: string | number | null;
  minBalance?: string | number | null;
  minDuration?: string | number | null;
  minAmount?: string | number | null;
  maxDuration?: string | number | null;
  maxAmount?: string | number | null;
  interestBasis?: string | null;
  capitalizationFrequency?: string | null;
  dayCountConvention?: string | null;
}

interface CreatePackageFormProps {
  kind: PackageKind;
  networkId: string | number;
  onAdded: () => void;
  onClose: () => void;
}

interface EditPackageFormProps {
  kind: PackageKind;
  initialData: PackageInitialData;
  onUpdated?: (saved: unknown) => void;
  onClose: () => void;
}

function toValue(value: string | number | null | undefined): string {
  return value == null ? "" : String(value);
}

function initialValues(data?: PackageInitialData): PackageValues {
  if (!data) return { ...EMPTY_VALUES };
  return {
    name: toValue(data.name),
    interestRate: toValue(data.interestRate),
    description: toValue(data.description),
    minBalance: toValue(data.minBalance),
    minDuration: toValue(data.minDuration),
    minAmount: toValue(data.minAmount),
    maxDuration: toValue(data.maxDuration),
    maxAmount: toValue(data.maxAmount),
    interestBasis: data.interestBasis ?? "DAILY_PRODUCT",
    capitalizationFrequency: data.capitalizationFrequency ?? "MONTHLY",
    dayCountConvention: data.dayCountConvention ?? "ACTUAL_365",
  };
}

function useBanner(initialUrl: string | null) {
  const [banner, setBanner] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(initialUrl);
  const [removeBanner, setRemoveBanner] = useState(false);

  const selectBanner = (file: File) => {
    if (file.size > 5 * 1024 * 1024) throw new Error("Banner must be 5 MB or smaller");
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      throw new Error("Banner must be PNG, JPEG, or WebP");
    }
    setBanner(file);
    setRemoveBanner(false);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const clearBanner = () => {
    setBanner(null);
    setPreview(null);
    setRemoveBanner(true);
  };

  return { banner, preview, removeBanner, selectBanner, clearBanner };
}

function PackageFields({
  config,
  values,
  onChange,
}: {
  config: PackageConfiguration;
  values: PackageValues;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}) {
  return (
    <>
      {config.fields.map((field) => (
        <div key={field.name}>
          <label className="mb-2 block font-semibold">{field.label}</label>
          {field.type === "select" ? (
            <select name={field.name} value={values[field.name]} onChange={onChange} required={field.required} className="w-full rounded-full border border-gray-300 bg-white px-4 py-3 focus:border-black focus:outline-none">
              {field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          ) : (
            <input name={field.name} type={field.type ?? "text"} step={field.step} value={values[field.name]} onChange={onChange} placeholder={field.placeholder} required={field.required} className="w-full rounded-full border border-gray-300 px-4 py-3 focus:border-black focus:outline-none" />
          )}
        </div>
      ))}
      <div>
        <label className="mb-2 block font-semibold">Description</label>
        <textarea
          name="description"
          value={values.description}
          onChange={onChange}
          placeholder="Enter package description (optional)"
          rows={3}
          className="w-full resize-none rounded-2xl border border-gray-300 px-4 py-3 focus:border-black focus:outline-none"
        />
      </div>
    </>
  );
}

function BannerInput({
  preview,
  onSelect,
  onClear,
}: {
  preview: string | null;
  onSelect: (file: File) => void;
  onClear: () => void;
}) {
  return (
    <div>
      <label className="mb-2 block font-semibold">Package Banner (Optional)</label>
      {preview && (
        <div className="relative mb-3">
          <img src={preview} alt="Banner preview" className="h-48 w-full rounded-lg object-cover" />
          <button
            type="button"
            onClick={onClear}
            className="absolute right-2 top-2 rounded-full bg-red-500 px-3 py-1 text-white hover:bg-red-600"
          >
            Remove
          </button>
        </div>
      )}
      <input
        type="file"
        name="banner"
        accept=".png,.jpg,.jpeg,.webp"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onSelect(file);
        }}
        className="w-full rounded-full border border-gray-300 px-4 py-2 text-gray-700 file:mr-3 file:rounded-full file:border-0 file:bg-teal-500 file:px-4 file:py-2 file:font-semibold file:text-white"
      />
    </div>
  );
}

export function CreatePackageForm({ kind, networkId, onAdded, onClose }: CreatePackageFormProps) {
  const config = CONFIG[kind];
  const Icon = config.icon;
  const [values, setValues] = useState<PackageValues>(() => initialValues());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bannerState = useBanner(null);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const name = event.target.name as FieldName;
    if (!(name in EMPTY_VALUES)) return;
    setValues((previous) => ({ ...previous, [name]: event.target.value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const body = new FormData();
      for (const field of [...config.fields, { name: "description" as const }]) {
        body.append(field.name, values[field.name]);
      }
      if (bannerState.banner) body.append("banner", bannerState.banner);
      await apiFetch(`${API_BASE}/finance/${config.endpoint}/${String(networkId)}`, {
        method: "POST",
        body,
      });
      onAdded();
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to add package");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      className="flex flex-col gap-5"
    >
      <div className="flex justify-center"><Icon className="h-16 w-16 text-teal-500" /></div>
      {error && <div className="rounded-lg border border-red-400 bg-red-100 px-4 py-3 text-red-700">{error}</div>}
      <BannerInput preview={bannerState.preview} onSelect={bannerState.selectBanner} onClear={bannerState.clearBanner} />
      <PackageFields config={config} values={values} onChange={handleChange} />
      <button type="submit" disabled={loading} className="mt-4 w-full rounded-full bg-teal-500 py-3 font-semibold text-white hover:bg-teal-600 disabled:bg-gray-300">
        {loading ? "Adding..." : `Add ${config.createLabel}`}
      </button>
    </form>
  );
}

export function EditPackageForm({ kind, initialData, onUpdated, onClose }: EditPackageFormProps) {
  const config = CONFIG[kind];
  const [values, setValues] = useState<PackageValues>(() => initialValues(initialData));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const initialBannerUrl = initialData.bannerData
    ? `${API_BASE}/finance/${config.endpoint}/${String(initialData.id)}/banner`
    : null;
  const bannerState = useBanner(initialBannerUrl);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const name = event.target.name as FieldName;
    if (!(name in EMPTY_VALUES)) return;
    setValues((previous) => ({ ...previous, [name]: event.target.value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const body = new FormData();
      for (const field of [...config.fields, { name: "description" as const }]) {
        body.append(field.name, values[field.name]);
      }
      body.append("removeBanner", String(bannerState.removeBanner));
      if (bannerState.banner) body.append("banner", bannerState.banner);
      const response = await apiFetch(
        `${API_BASE}/finance/${config.endpoint}/${String(initialData.id)}`,
        { method: "PUT", body },
      );
      const saved: unknown = await response.json();
      onUpdated?.(saved);
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to update package");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      className="flex flex-col gap-5"
    >
      {error && <div className="rounded-lg border border-red-400 bg-red-100 px-4 py-3 text-red-700">{error}</div>}
      <BannerInput preview={bannerState.preview} onSelect={bannerState.selectBanner} onClear={bannerState.clearBanner} />
      <PackageFields config={config} values={values} onChange={handleChange} />
      <button type="submit" disabled={saving} className="mt-4 w-full rounded-full bg-teal-500 py-3 font-semibold text-white hover:bg-teal-600 disabled:bg-gray-300">
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}
