import { EditPackageForm } from "./PackageForm";

export default function EditLoanPackageForm(props: Omit<Parameters<typeof EditPackageForm>[0], "kind">) {
  return <EditPackageForm {...props} kind="loan" />;
}
