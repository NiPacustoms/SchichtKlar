/**
 * Script to modernize all Dialog components
 * This script adds modern styling patterns to all Dialog components
 * 
 * Patterns to apply:
 * 1. DialogTitle: fontWeight: 700, fontSize: 20px, py: 2.5
 * 2. DialogActions: p: 3, pt: 2
 * 3. Buttons: textTransform: 'none', fontWeight: 600, borderRadius: 2
 * 4. PaperProps: borderRadius: 3 (or 20px 20px 0 0 for mobile)
 * 5. Alerts: borderRadius: 2, border with color
 */

// This is a reference script - actual modernization is done manually
// to ensure proper TypeScript types and component structure

console.log('Dialog modernization patterns:');
console.log(`
1. DialogTitle:
   sx={{ fontWeight: 700, fontSize: '20px', py: 2.5 }}

2. DialogActions:
   sx={{ p: 3, pt: 2 }}

3. Buttons:
   sx={{
     textTransform: 'none',
     fontWeight: 600,
     borderRadius: 2,
     px: 3,
     boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)',
   }}

4. PaperProps:
   sx={{ borderRadius: 3 }}

5. Alerts:
   sx={{
     borderRadius: 2,
     border: '1px solid',
     borderColor: 'severity.main',
   }}
`);

