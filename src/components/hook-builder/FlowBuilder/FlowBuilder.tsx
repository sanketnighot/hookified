"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { slideUpVariants } from "@/lib/animations";
import { ActionType, TriggerType } from "@/lib/types";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface FlowBuilderProps {
  trigger: TriggerType | null;
  action: ActionType | null;
}

export function FlowBuilder({ trigger, action }: FlowBuilderProps) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Configure Your Hook</h2>
        <p className="text-muted-foreground">
          Set up the details for your automation
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
        {/* Trigger Config */}
        <motion.div variants={slideUpVariants}>
          <Card className="glass border-white/10">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Trigger</CardTitle>
              <p className="text-lg font-semibold">{trigger}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Hook Name</Label>
                <Input placeholder="My Awesome Hook" className="glass" />
              </div>

              {trigger === "ONCHAIN" && (
                <>
                  <div className="space-y-2">
                    <Label>Contract Address</Label>
                    <Input placeholder="0x..." className="glass" />
                  </div>
                  <div className="space-y-2">
                    <Label>Event Name</Label>
                    <Input placeholder="Transfer" className="glass" />
                  </div>
                </>
              )}

              {trigger === "CRON" && (
                <div className="space-y-2">
                  <Label>Schedule</Label>
                  <Input placeholder="0 9 * * *" className="glass" />
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Arrow */}
        <div className="flex justify-center">
          <ArrowRight className="w-8 h-8 text-muted-foreground" />
        </div>

        {/* Action Config */}
        <motion.div variants={slideUpVariants} transition={{ delay: 0.1 }}>
          <Card className="glass border-white/10">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Action</CardTitle>
              <p className="text-lg font-semibold">{action}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {action === "TELEGRAM" && (
                <>
                  <div className="space-y-2">
                    <Label>Bot Token</Label>
                    <Input type="password" placeholder="Your bot token" className="glass" />
                  </div>
                  <div className="space-y-2">
                    <Label>Chat ID</Label>
                    <Input placeholder="Your chat ID" className="glass" />
                  </div>
                  <div className="space-y-2">
                    <Label>Message Template</Label>
                    <Input placeholder="Event detected: {data}" className="glass" />
                  </div>
                </>
              )}

              {action === "WEBHOOK" && (
                <>
                  <div className="space-y-2">
                    <Label>Webhook URL</Label>
                    <Input placeholder="https://..." className="glass" />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

