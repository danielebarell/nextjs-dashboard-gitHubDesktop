"use server";
import { z } from "zod";
import postgres from "postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type State = {
  message?: string | null;
  errors?: {
    customer_id?: string[];
    amount?: string[];
    status?: string[];
  };
};

const redirectURL = "/dashboard/invoices";
//zod, define a schema
const InvoiceSchema = z.object({
  id: z.string(),
  customer_id: z.string({ invalid_type_error: "Please select a customer" }),
  amount: z.coerce.number().gt(0, "Amount must be greater than 0"),
  status: z.enum(["paid", "pending"], {
    invalid_type_error: 'Status must be "paid" or "pending"',
  }),
  date: z.string(),
});
const formDataInvoiceSchema = InvoiceSchema.omit({ id: true, date: true });
//
const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });
//
export async function updateInvoiceAction(id: string, formData: FormData) {
  const partialData = {
    customer_id: formData.get("customerId"),
    amount: formData.get("amount") || "0",
    status: formData.get("status")?.toString(),
  };
  const validatedData = formDataInvoiceSchema.safeParse(partialData);
  if (!validatedData.success) {
    return {
      errors: validatedData.error.flatten().fieldErrors,
      message: "Something was wrong during form compiation",
    };
  }
  const { customer_id, amount, status } = validatedData.data;

  try {
    await sql`
  UPDATE invoices
SET customer_id = ${customer_id}, amount = ${amount * 100}, status = ${status}
WHERE id = ${id}
`;
  } catch (err) {
    console.error((err as Error).message);
  }
  revalidatePath(redirectURL); //remove cash so invoices page will be refreshed
  return redirect(redirectURL);
  //
}
//
export async function createInvoiceAction(
  prevState: State,
  formData: FormData
) {
  const partialData = {
    customer_id: formData.get("customerId"),
    amount: formData.get("amount") || "0",
    status: formData.get("status")?.toString(),
  };
  //zod, validate data
  const validatedData = formDataInvoiceSchema.safeParse(partialData);
  if (!validatedData.success) {
    return {
      errors: validatedData.error.flatten().fieldErrors,
      message: "Something was wrong during form compiation",
    };
  }

  const { customer_id, amount, status } = validatedData.data;
  const amount$ = amount * 100;
  const date = new Date().toISOString().split("T")[0]; //"2011-10-05T14:48:00.000Z" -> "2011-10-05
  try {
    await sql`INSERT INTO invoices 
    (customer_id, amount, status, date) 
    VALUES (${customer_id},${amount$}, ${status}, ${date})
    `;
  } catch (err) {
    if (err instanceof z.ZodError) {
      console.error("Errore nella validazione dei dati");
    } else {
      console.error("Errore nella registrazione dati", err);
    }
  }
  revalidatePath(redirectURL); //remove cash so invoices page will be refreshed
  return redirect(redirectURL);
}
/* export async function deleteInvoiceAction(id: string) {
  try {
    await sql`DELETE FROM invoices
  WHERE id=${id}
  `;
  } catch (err) {
    console.error((err as Error).message);
  }
  revalidatePath(redirectURL); //remove cash so invoices page will be refreshed
  redirect(redirectURL);
} */
export async function deleteInvoiceAction(id: string) {
  throw new Error("No deletion :P");
  await sql`DELETE FROM invoices
  WHERE id=${id}
  `;
  revalidatePath(redirectURL); //remove cash so invoices page will be refreshed
}
