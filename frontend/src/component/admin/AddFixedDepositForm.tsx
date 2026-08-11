import { CreatePackageForm } from "./PackageForm";

export default function AddFixedDepositForm(props: Omit<Parameters<typeof CreatePackageForm>[0], "kind">) {
  return <CreatePackageForm {...props} kind="fixed" />;
}
