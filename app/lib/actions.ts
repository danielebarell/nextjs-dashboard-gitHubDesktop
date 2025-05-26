"use server";
import { z } from "zod";
import postgres from "postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
const redirectURL = "/dashboard/invoices";
//zod, define a schema
const InvoiceSchema = z.object({
  id: z.string(),
  customer_id: z.string().min(1),
  amount: z.coerce.number().min(0),
  status: z.string(),
  date: z.string(),
});
const formDataInvoiceSchema = InvoiceSchema.omit({ id: true, date: true });
//
const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });
//
export async function updateInvoiceAction(id: string, formData: FormData) {
  console.log("updateInvoiceAction", formData.get("amount"));
  const partialData = {
    customer_id: formData.get("customerId"),
    amount: formData.get("amount") || "0",
    status: formData.get("status")?.toString(),
  };
  const validatedData = formDataInvoiceSchema.parse(partialData);
  validatedData.amount *= 100;
  const { customer_id, amount, status } = validatedData;
  await sql`
  UPDATE invoices
SET customer_id = ${customer_id}, amount = ${amount}, status = ${status}
WHERE id = ${id}
`;
  //
  revalidatePath(redirectURL); //remove cash so invoices page will be refreshed
  redirect(redirectURL);
}
//
export async function createInvoiceAction(formData: FormData) {
  const partialData = {
    customer_id: formData.get("customerId"),
    amount: formData.get("amount") || "0",
    status: formData.get("status")?.toString(),
  };
  try {
    //zod, validate data
    const validatedData = formDataInvoiceSchema.parse(partialData);
    validatedData.amount = validatedData.amount * 100;
    const { customer_id, amount, status } = validatedData;
    const date = new Date().toISOString().split("T")[0]; //"2011-10-05T14:48:00.000Z" -> "2011-10-05
    await sql`INSERT INTO invoices 
    (customer_id, amount, status, date) 
    VALUES (${customer_id},${amount}, ${status}, ${date})
    `;
  } catch (err) {
    if (err instanceof z.ZodError) {
      console.error("Errore nella validazione dei dati");
    } else {
      console.error("Errore nella registrazione dati", err);
    }
  } finally {
    revalidatePath(redirectURL); //remove cash so invoices page will be refreshed
    redirect(redirectURL);
  }
}
export async function deleteInvoiceAction(id: string) {
  try {
    await sql`DELETE FROM invoices
  WHERE id=${id}
  `;
  } catch (err) {
    console.error((err as Error).message);
  } finally {
    revalidatePath(redirectURL); //remove cash so invoices page will be refreshed
    redirect(redirectURL);
  }
}
