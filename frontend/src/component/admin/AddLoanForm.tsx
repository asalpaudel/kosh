import { CreatePackageForm } from "./PackageForm";

export default function AddLoanForm(props: Omit<Parameters<typeof CreatePackageForm>[0], "kind">) {
  return <CreatePackageForm {...props} kind="loan" />;
}
