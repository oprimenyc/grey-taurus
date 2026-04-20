import { sql } from "drizzle-orm";
import { db } from "./index.js";

export async function runMigrations(): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS opportunities (
      id SERIAL PRIMARY KEY,
      notice_id TEXT UNIQUE NOT NULL,
      title TEXT,
      agency TEXT,
      posted_date TIMESTAMP,
      response_deadline TIMESTAMP,
      naics_code TEXT,
      type TEXT,
      description TEXT,
      set_aside TEXT,
      place_of_performance TEXT,
      score INTEGER DEFAULT 0,
      source TEXT DEFAULT 'sam_gov',
      status TEXT DEFAULT 'queued',
      added_date TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS grants (
      id SERIAL PRIMARY KEY,
      grant_id TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      agency TEXT,
      amount INTEGER,
      eligibility TEXT,
      deadline TIMESTAMP,
      description TEXT,
      score INTEGER DEFAULT 0,
      status TEXT DEFAULT 'queued',
      eligible_entity TEXT DEFAULT 'greytaurus',
      added_date TIMESTAMP DEFAULT NOW(),
      last_action TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS subcontract_leads (
      id SERIAL PRIMARY KEY,
      prime_contractor TEXT NOT NULL,
      contract_title TEXT,
      award_amount INTEGER,
      agency TEXT,
      naics_code TEXT,
      expiry_date TIMESTAMP,
      contract_id TEXT UNIQUE NOT NULL,
      outreach_status TEXT DEFAULT 'queued',
      score INTEGER DEFAULT 0,
      added_date TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS prime_contractors (
      id SERIAL PRIMARY KEY,
      company_name TEXT NOT NULL,
      cage TEXT,
      uei TEXT,
      naics_codes TEXT[],
      active_contracts INTEGER DEFAULT 0,
      total_contract_value INTEGER DEFAULT 0,
      last_contact_date TIMESTAMP,
      status TEXT DEFAULT 'new'
    );

    CREATE TABLE IF NOT EXISTS qa_flags (
      id SERIAL PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id INTEGER NOT NULL,
      flag_type TEXT NOT NULL,
      flag_detail TEXT,
      resolved BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS agent_logs (
      id SERIAL PRIMARY KEY,
      agent_name TEXT NOT NULL,
      run_at TIMESTAMP DEFAULT NOW(),
      status TEXT NOT NULL,
      opportunities_found INTEGER DEFAULT 0,
      grants_found INTEGER DEFAULT 0,
      subcontracts_found INTEGER DEFAULT 0,
      reddit_posts_found INTEGER DEFAULT 0,
      emails_queued INTEGER DEFAULT 0,
      error_message TEXT,
      duration_ms INTEGER
    );

    CREATE TABLE IF NOT EXISTS sent_emails (
      id SERIAL PRIMARY KEY,
      recipient TEXT NOT NULL,
      subject TEXT,
      template_type TEXT,
      opportunity_ref TEXT,
      sent_at TIMESTAMP DEFAULT NOW(),
      status TEXT DEFAULT 'sent',
      guard_rail_flags TEXT
    );

    CREATE TABLE IF NOT EXISTS reddit_intel (
      id SERIAL PRIMARY KEY,
      post_id TEXT UNIQUE NOT NULL,
      subreddit TEXT,
      title TEXT,
      body TEXT,
      author TEXT,
      url TEXT,
      category TEXT DEFAULT 'UNCATEGORIZED',
      score INTEGER DEFAULT 0,
      reddit_score INTEGER DEFAULT 0,
      num_comments INTEGER DEFAULT 0,
      created_at TIMESTAMP,
      scraped_at TIMESTAMP DEFAULT NOW(),
      action_taken TEXT DEFAULT 'none',
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS pipeline (
      id SERIAL PRIMARY KEY,
      opportunity_id INTEGER,
      title TEXT NOT NULL,
      agency TEXT,
      stage TEXT DEFAULT 'identified',
      score INTEGER DEFAULT 0,
      naics_code TEXT,
      response_deadline TIMESTAMP,
      assigned_to TEXT,
      notes TEXT,
      added_date TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS proposals (
      id SERIAL PRIMARY KEY,
      opportunity_id INTEGER,
      title TEXT NOT NULL,
      agency TEXT,
      status TEXT DEFAULT 'draft',
      content TEXT,
      qa_score INTEGER,
      qa_feedback TEXT,
      submitted_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS outreach (
      id SERIAL PRIMARY KEY,
      target_name TEXT,
      target_email TEXT,
      target_org TEXT,
      entity_type TEXT DEFAULT 'prime',
      subject TEXT,
      body TEXT,
      status TEXT DEFAULT 'draft',
      qa_score INTEGER,
      qa_feedback TEXT,
      linked_opportunity_id INTEGER,
      sent_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS settings (
      id SERIAL PRIMARY KEY,
      key TEXT UNIQUE NOT NULL,
      value TEXT,
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS agent_runs (
      id SERIAL PRIMARY KEY,
      agent_name TEXT NOT NULL,
      status TEXT NOT NULL,
      input TEXT,
      output TEXT,
      error_message TEXT,
      duration_ms INTEGER,
      triggered_by TEXT DEFAULT 'scheduler',
      started_at TIMESTAMP DEFAULT NOW(),
      completed_at TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id SERIAL PRIMARY KEY,
      title TEXT,
      context TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      conversation_id INTEGER NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS daily_briefs (
      id SERIAL PRIMARY KEY,
      subject TEXT,
      body TEXT,
      opportunities_count INTEGER DEFAULT 0,
      grants_count INTEGER DEFAULT 0,
      subcontracts_count INTEGER DEFAULT 0,
      gap_notes TEXT,
      sent_to TEXT,
      sent_at TIMESTAMP DEFAULT NOW(),
      status TEXT DEFAULT 'sent'
    );

    CREATE TABLE IF NOT EXISTS user_sessions (
      sid VARCHAR NOT NULL COLLATE "default",
      sess JSON NOT NULL,
      expire TIMESTAMP(6) NOT NULL,
      CONSTRAINT session_pkey PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE
    );
    CREATE INDEX IF NOT EXISTS idx_session_expire ON user_sessions (expire);
  `);
}
