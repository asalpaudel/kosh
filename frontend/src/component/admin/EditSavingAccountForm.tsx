import { EditPackageForm } from "./PackageForm";

export default function EditSavingAccountForm(props: Omit<Parameters<typeof EditPackageForm>[0], "kind">) {
  return <EditPackageForm {...props} kind="saving" />;
}
