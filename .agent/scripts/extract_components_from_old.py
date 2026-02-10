
import re

def extract_component(source_file, start_marker, end_marker, dest_file):
    try:
        content = ""
        with open(source_file, 'r', encoding='utf-16') as f:
            content = f.read()
            
        start_pos = content.find(start_marker)
        if start_pos == -1:
            print(f"Marker '{start_marker}' not found in {source_file}")
            return

        end_pos = content.find(end_marker, start_pos)
        if end_pos == -1:
            print(f"Marker '{end_marker}' not found after start position")
            return

        component_code = content[start_pos:end_pos]
        
        # Add imports to the top of the destination file
        imports = """import React, { useState, useMemo } from 'react';
import {
    CalendarDays, X, CheckCircle2, Clock, Plus, Minus, AlertCircle, ChevronRight, ChevronLeft,
    Ticket, Info, Bell, Search, Edit3, Camera, Trash2, RefreshCw, QrCode, Copy, ExternalLink,
    History, TrendingUp, MessageCircle, Phone, Save, Loader2, Play, Image as ImageIcon,
    Upload, Mic, Send, Lock
} from 'lucide-react';
import { toast } from 'sonner';
import {
    User,
    UserRole,
    Academy,
    Event,
    EventStatus,
    Visit,
    VisitStatus,
    AcademyTemperature,
    ContactPerson,
    FinanceRecord,
    FinanceStatus,
    Voucher,
} from '../types';
import { DatabaseService } from '../lib/supabase';
import { cn, generateVoucherCode } from '../lib/utils';
import { SmartVoiceInput } from './SmartVoiceInput'; 
import { VisitDetail } from './VisitDetail';

"""
        # Note: VisitDetail import might be circular but needed if used inside SalespersonEvents (unlikely, but possible).
        # Actually EventDetailAdmin uses VisitDetail? No. App uses VisitDetail.
        # Let's keep common imports.

        if "SalespersonEvents" in dest_file:
             # Add specific imports if needed, or rely on the big block above
             pass

        with open(dest_file, 'w', encoding='utf-8') as f:
            f.write(imports)
            f.write("export " + component_code) # Add export keyword
            
        print(f"Extracted component to {dest_file}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    # Extract AdminFinance
    extract_component('App_old.tsx', 'const AdminFinance', 'const SalespersonEvents', 'components/AdminFinance.tsx')
    
    # Extract SalespersonEvents
    extract_component('App_old.tsx', 'const SalespersonEvents', 'const SmartVoiceInput', 'components/SalespersonEvents.tsx')
