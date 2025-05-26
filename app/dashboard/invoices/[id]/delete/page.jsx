"use client";
import { deleteInvoiceAction } from "@/app/lib/actions";
import { useParams } from "next/navigation";
import Link from "next/link";
export default function DeletePage() {
  const { id } = useParams();

  return (
    <>
      <p className="text-center">Are you shere to delete the invoice?</p>
      <div className="mt-5 flex justify-evenly">
        <Link className="border-2 border-sky-500" href="/dashboard/invoices">
          No, keep it
        </Link>
        <button
          className="border-2 border-pink-500"
          onClick={() => deleteInvoiceAction(id)}
        >
          Yes, delete it
        </button>
      </div>
    </>
  );
}
