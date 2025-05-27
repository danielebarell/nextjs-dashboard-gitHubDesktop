import Breadcrumbs from "@/app/ui/invoices/breadcrumbs";
import Form from "@/app/ui/invoices/edit-form";
import { notFound } from "next/navigation";
import { fetchCustomers, fetchInvoiceById } from "@/app/lib/data";

export default async function InvoiceEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  //const customers = await fetchCustomers();
  //const invoice = await fetchInvoiceById(id);

  const [customers, invoice] = await Promise.all([
    fetchCustomers(),
    fetchInvoiceById(id),
  ]);
  if (!invoice) {
    notFound();
  }
  return (
    <>
      <Breadcrumbs
        breadcrumbs={[
          { label: "Invoices", href: "/dashboard/invoices" },
          {
            label: "Edit",
            href: `/dashboard/invoices/${id}/edit`,
            active: true,
          },
        ]}
      />
      <Form customers={customers} invoice={invoice} />
    </>
  );
}
