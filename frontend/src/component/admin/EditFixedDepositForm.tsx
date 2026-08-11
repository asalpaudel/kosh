import { EditPackageForm } from "./PackageForm";

export default function EditFixedDepositForm(props: Omit<Parameters<typeof EditPackageForm>[0], "kind">) {
  return <EditPackageForm {...props} kind="fixed" />;
}
