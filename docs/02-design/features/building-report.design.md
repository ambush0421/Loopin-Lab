# Building Report Design Document

> Version: 1.0.0 | Created: 2026-02-10 | Status: Draft

## 1. Overview
The Building Report system is a web-based application designed to streamline the process of collecting building data and generating professional inspection reports. It utilizes a dynamic form for data entry and client-side rendering for report generation.

## 2. Architecture
### System Diagram
[UI Layer (Form)] -> [State Manager] -> [Report Engine (PDF/HTML)]
                      |
                      v
                [Local Storage]

### Components
- **ReportForm**: A dynamic form component for building metadata and checklists.
- **PhotoManager**: Handles photo uploads and previews using Blob URLs.
- **ReportGenerator**: Transforms structured JSON data into a printable HTML template or PDF.
- **StorageService**: Manages saving and retrieving reports from browser local storage.

## 3. Data Model
### Entities
```typescript
interface BuildingReport {
  id: string;
  metadata: {
    name: string;
    address: string;
    owner: string;
    date: string;
  };
  checklist: Array<{
    item: string;
    status: 'pass' | 'fail' | 'na';
    comments: string;
  }>;
  photos: string[]; // Base64 or Blob URLs
  createdAt: string;
}
```

## 4. API Specification
### Endpoints (Local/Internal)
| Method | Path | Description |
|--------|------|-------------|
| GET    | /reports | List all saved reports from local storage |
| POST   | /reports | Save a new report |
| GET    | /reports/:id | Retrieve a specific report |

## 5. UI Design
- **Dashboard**: List of previous reports with "Create New" button.
- **Editor**: Multi-step form (Metadata -> Checklist -> Photos).
- **Preview**: Live view of the generated report before export.

## 6. Test Plan
| Test Case | Expected Result |
|-----------|-----------------|
| Form Submission | Data correctly formatted into BuildingReport entity |
| PDF Export | PDF generated with all input fields present |
| Persistence | Refreshing page retains draft data in local storage |
