import { CreatePackageForm } from "./PackageForm";

export default function AddSavingAccountForm(props: Omit<Parameters<typeof CreatePackageForm>[0], "kind">) {
  return <CreatePackageForm {...props} kind="saving" />;
}
