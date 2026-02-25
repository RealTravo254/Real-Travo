import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Smartphone, Building2, Save, Loader2, CheckCircle, Pencil } from "lucide-react";

// Paystack-supported banks in Kenya
const KENYA_BANKS = [
  { name: "Kenya Commercial Bank", code: "068" },
  { name: "Equity Bank", code: "049" },
  { name: "Co-operative Bank of Kenya", code: "011" },
  { name: "ABSA Bank Kenya", code: "003" },
  { name: "Standard Chartered Bank Kenya", code: "004" },
  { name: "Stanbic Bank Kenya", code: "031" },
  { name: "Diamond Trust Bank", code: "063" },
  { name: "NCBA Bank", code: "007" },
  { name: "I&M Bank", code: "057" },
  { name: "Family Bank", code: "070" },
  { name: "National Bank of Kenya", code: "012" },
  { name: "Prime Bank", code: "010" },
  { name: "Bank of Africa Kenya", code: "019" },
  { name: "HFC Ltd", code: "008" },
  { name: "Citibank N.A. Kenya", code: "016" },
  { name: "Bank of Baroda Kenya", code: "006" },
  { name: "Bank of India", code: "005" },
  { name: "Sidian Bank", code: "066" },
  { name: "Victoria Commercial Bank", code: "054" },
  { name: "Guardian Bank", code: "053" },
  { name: "Gulf African Bank", code: "072" },
  { name: "First Community Bank", code: "074" },
  { name: "Credit Bank", code: "025" },
  { name: "Consolidated Bank", code: "023" },
  { name: "African Banking Corporation", code: "035" },
  { name: "Transnational Bank", code: "026" },
  { name: "Spire Bank", code: "051" },
  { name: "Middle East Bank", code: "018" },
  { name: "Mayfair CIB Bank", code: "065" },
  { name: "SBM Bank Kenya", code: "076" },
  { name: "Access Bank Kenya", code: "084" },
  { name: "UBA Kenya", code: "085" },
  { name: "Kingdom Bank", code: "051" },
  { name: "DIB Bank Kenya", code: "078" },
];

interface WithdrawalDetailsSectionProps {
  userId: string;
}

export const WithdrawalDetailsSection = ({ userId }: WithdrawalDetailsSectionProps) => {
  const [mpesaNumber, setMpesaNumber] = useState("");
  const [selectedBank, setSelectedBank] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [hasSavedDetails, setHasSavedDetails] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      const { data } = await supabase
        .from("bank_details")
        .select("bank_name, account_number, account_holder_name")
        .eq("user_id", userId)
        .maybeSingle();
      
      if (data) {
        setSelectedBank(data.bank_name || "");
        setBankCode(KENYA_BANKS.find(b => b.name === data.bank_name)?.code || "");
        setAccountNumber(data.account_number || "");
        setAccountName(data.account_holder_name || "");
        if (data.bank_name || data.account_number) {
          setHasSavedDetails(true);
        }
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("phone_number")
        .eq("id", userId)
        .single();
      
      if (profile?.phone_number) {
        setMpesaNumber(profile.phone_number);
        if (!hasSavedDetails && profile.phone_number) {
          setHasSavedDetails(true);
        }
      }
      setLoaded(true);
    };
    fetchDetails();
  }, [userId]);

  const handleBankSelect = (bankName: string) => {
    setSelectedBank(bankName);
    const bank = KENYA_BANKS.find(b => b.name === bankName);
    setBankCode(bank?.code || "");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (selectedBank || accountNumber || accountName) {
        const { data: existing } = await supabase
          .from("bank_details")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();

        if (existing) {
          await supabase.from("bank_details").update({
            bank_name: selectedBank,
            account_number: accountNumber,
            account_holder_name: accountName,
            last_updated: new Date().toISOString(),
          }).eq("user_id", userId);
        } else {
          await supabase.from("bank_details").insert({
            user_id: userId,
            bank_name: selectedBank,
            account_number: accountNumber,
            account_holder_name: accountName,
          });
        }
      }

      if (mpesaNumber) {
        await supabase.from("profiles").update({
          phone_number: mpesaNumber,
        }).eq("id", userId);
      }

      setHasSavedDetails(true);
      setIsEditing(false);
      toast.success("Withdrawal details saved");
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) return null;

  // Show saved details view when not editing and details exist
  if (hasSavedDetails && !isEditing) {
    return (
      <div className="bg-card rounded-xl p-4 border border-border mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-black uppercase tracking-tight text-foreground">Withdrawal Details</h2>
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Your saved payout information</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="rounded-lg text-[9px] font-bold uppercase h-7 px-3">
            <Pencil className="h-3 w-3 mr-1" /> Edit
          </Button>
        </div>
        
        <div className="space-y-3">
          {mpesaNumber && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="p-1.5 rounded-md bg-primary/10">
                <Smartphone className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">M-Pesa</p>
                <p className="text-sm font-bold text-foreground">{mpesaNumber}</p>
              </div>
              <CheckCircle className="h-4 w-4 text-primary ml-auto" />
            </div>
          )}
          {selectedBank && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="p-1.5 rounded-md bg-primary/10">
                <Building2 className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Bank Account</p>
                <p className="text-sm font-bold text-foreground truncate">{selectedBank}</p>
                <p className="text-xs text-muted-foreground">{accountNumber} • {accountName}</p>
              </div>
              <CheckCircle className="h-4 w-4 text-primary ml-auto flex-shrink-0" />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-4 border border-border mb-4">
      <h2 className="text-sm font-black uppercase tracking-tight text-foreground mb-1">Withdrawal Details</h2>
      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Set your M-Pesa & bank info for payouts</p>
      
      <div className="space-y-4">
        {/* M-Pesa */}
        <div className="space-y-2">
          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
            <Smartphone className="h-3 w-3" /> M-Pesa Number
          </Label>
          <Input
            type="tel"
            value={mpesaNumber}
            onChange={(e) => setMpesaNumber(e.target.value)}
            placeholder="e.g. 0712345678"
            className="rounded-lg h-10 text-sm"
          />
        </div>

        {/* Bank - Select from Paystack Kenya banks */}
        <div className="space-y-2">
          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
            <Building2 className="h-3 w-3" /> Bank Name
          </Label>
          <Select value={selectedBank} onValueChange={handleBankSelect}>
            <SelectTrigger className="rounded-lg h-10 text-sm">
              <SelectValue placeholder="Select your bank" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {KENYA_BANKS.map((bank) => (
                <SelectItem key={bank.code + bank.name} value={bank.name}>
                  {bank.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {bankCode && (
            <p className="text-[9px] text-muted-foreground">Bank code: {bankCode} (auto-filled)</p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Account No.</Label>
            <Input
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="Account number"
              className="rounded-lg h-10 text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Account Name</Label>
            <Input
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="Holder name"
              className="rounded-lg h-10 text-sm"
            />
          </div>
        </div>

        <div className="flex gap-2">
          {hasSavedDetails && (
            <Button variant="outline" onClick={() => setIsEditing(false)} size="sm" className="rounded-lg text-[9px] font-bold uppercase h-8 px-4 flex-1">
              Cancel
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving} size="sm" className="rounded-lg text-[9px] font-bold uppercase h-8 px-4 flex-1">
            {saving ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Saving...</> : <><Save className="h-3 w-3 mr-1" /> Save Details</>}
          </Button>
        </div>
      </div>
    </div>
  );
};
