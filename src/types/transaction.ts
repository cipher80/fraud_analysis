export type TransactionRow = Record<string, any>;

export type NormalizedTxn = {
  MID: string;
  Transaction_Date?: Date | null;
  Amount?: number | null;
  Settled_Amount?: number | null;
  Customer_VPA?: string | null;
  Card_Last4?: string | null;
  Payment_Mode?: string | null;
  KYB_ID?: string | null;
  Merchant_name?: string | null;
  Status?: string | null;
  Category?: string | null;
  Sub_Category?: string | null;
  Entity_Type?: string | null;
  Onboarding_date?: Date | null;
  Risk_category?: string | null;

  // Keep original row for table display if you want:
  __raw?: TransactionRow;
};
