import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Input, PasswordInput, PhoneInput } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, LogOut } from "lucide-react";

export const Route = createFileRoute("/app/profile")({
  head: () => ({ meta: [{ title: "Profile — FinRoute" }, { name: "description", content: "Manage your personal and business information." }] }),
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="relative shrink-0">
              <Avatar className="size-16"><AvatarFallback className="bg-primary text-primary-foreground text-lg">RS</AvatarFallback></Avatar>
              <button className="absolute -bottom-1 -right-1 grid size-6 place-items-center rounded-full border border-border bg-background" aria-label="Change photo"><Camera className="size-3" /></button>
            </div>
            <div className="min-w-0">
              <h2 className="truncate font-display text-xl font-bold">Rajesh Sharma</h2>
              <p className="truncate text-sm text-muted-foreground">Sharma Finance · Jaipur, Rajasthan</p>
              <div className="mt-1 flex flex-wrap gap-1.5"><Badge variant="secondary">Guest</Badge><Badge variant="outline">Verified</Badge></div>
            </div>
          </div>
          <Button variant="outline"><LogOut className="size-4" /> Log out</Button>
        </div>
      </Card>

      <Tabs defaultValue="personal">
        <TabsList>
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Card className="p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label>Full name</Label><Input className="mt-1.5" defaultValue="Rajesh Sharma" /></div>
              <div><Label>Mobile Number</Label><PhoneInput className="mt-1.5" defaultValue="9876543210" /></div>
              <div><Label>Email</Label><Input className="mt-1.5" defaultValue="rajesh@sharmafinance.in" /></div>
              <div><Label>City</Label><Input className="mt-1.5" defaultValue="Jaipur" /></div>
            </div>
            <div className="mt-6 flex justify-end gap-2"><Button variant="outline">Cancel</Button><Button>Save changes</Button></div>
          </Card>
        </TabsContent>

        <TabsContent value="business">
          <Card className="p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label>Business name</Label><Input className="mt-1.5" defaultValue="Sharma Finance" /></div>
              <div><Label>GSTIN</Label><Input className="mt-1.5" defaultValue="08AAACS1234A1Z5" /></div>
              <div><Label>Business type</Label><Input className="mt-1.5" defaultValue="Daily Finance" /></div>
              <div><Label>Owner PAN</Label><Input className="mt-1.5" defaultValue="ABCDE1234F" /></div>
              <div className="sm:col-span-2"><Label>Address</Label><Input className="mt-1.5" defaultValue="12/A, MI Road, Jaipur 302001" /></div>
            </div>
            <div className="mt-6 flex justify-end gap-2"><Button variant="outline">Cancel</Button><Button>Save changes</Button></div>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card className="p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Language</Label>
                <Select defaultValue="en"><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="en">English</SelectItem><SelectItem value="hi">हिन्दी</SelectItem><SelectItem value="ta">தமிழ்</SelectItem><SelectItem value="te">తెలుగు</SelectItem></SelectContent>
                </Select>
              </div>
              <div>
                <Label>Theme</Label>
                <Select defaultValue="system"><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="light">Light</SelectItem><SelectItem value="dark">Dark</SelectItem><SelectItem value="system">System</SelectItem></SelectContent>
                </Select>
              </div>
              <div>
                <Label>Currency</Label>
                <Select defaultValue="inr"><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="inr">₹ INR</SelectItem></SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date format</Label>
                <Select defaultValue="dmy"><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="dmy">DD/MM/YYYY</SelectItem><SelectItem value="ymd">YYYY-MM-DD</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label>Current password</Label><PasswordInput className="mt-1.5" placeholder="••••••••" /></div>
              <div><Label>New password</Label><PasswordInput className="mt-1.5" placeholder="••••••••" /></div>
              <div className="sm:col-span-2"><Label>Confirm new password</Label><PasswordInput className="mt-1.5" placeholder="••••••••" /></div>
            </div>
            <div className="mt-6 flex justify-between">
              <p className="text-xs text-muted-foreground">Two-factor authentication is <span className="text-success font-semibold">enabled</span>.</p>
              <Button>Update password</Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
