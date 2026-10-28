CREATE TABLE "operation_results" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"guest_id" uuid,
	"command_kind" text NOT NULL,
	"scope_kind" text,
	"scope_id" uuid,
	"request_fingerprint" text NOT NULL,
	"state" text NOT NULL,
	"result" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "operation_actor_exclusive" CHECK (("operation_results"."user_id" IS NOT NULL) <> ("operation_results"."guest_id" IS NOT NULL)),
	CONSTRAINT "operation_scope_complete" CHECK (("operation_results"."scope_kind" IS NULL) = ("operation_results"."scope_id" IS NULL)),
	CONSTRAINT "operation_fingerprint_valid" CHECK ("operation_results"."request_fingerprint" ~ '^[a-f0-9]{64}$'),
	CONSTRAINT "operation_completion_valid" CHECK ((
    "operation_results"."state" = 'RUNNING' AND "operation_results"."result" IS NULL AND "operation_results"."completed_at" IS NULL
  ) OR (
    "operation_results"."state" = 'COMPLETED' AND "operation_results"."result" IS NOT NULL AND "operation_results"."completed_at" IS NOT NULL
  ))
);
--> statement-breakpoint
CREATE TABLE "scoped_guest_access" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scope_kind" text NOT NULL,
	"scope_id" uuid NOT NULL,
	"token_digest" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "scoped_guest_kind_valid" CHECK ("scoped_guest_access"."scope_kind" IN ('PRESENTATION', 'MEETING')),
	CONSTRAINT "scoped_guest_digest_valid" CHECK ("scoped_guest_access"."token_digest" ~ '^[a-f0-9]{64}$')
);
--> statement-breakpoint
ALTER TABLE "operation_results" ADD CONSTRAINT "operation_results_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operation_results" ADD CONSTRAINT "operation_results_guest_id_scoped_guest_access_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."scoped_guest_access"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "operation_user_idx" ON "operation_results" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "operation_guest_idx" ON "operation_results" USING btree ("guest_id");--> statement-breakpoint
CREATE UNIQUE INDEX "scoped_guest_token_unique" ON "scoped_guest_access" USING btree ("token_digest");--> statement-breakpoint
CREATE INDEX "scoped_guest_scope_idx" ON "scoped_guest_access" USING btree ("scope_kind","scope_id");