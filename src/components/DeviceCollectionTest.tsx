import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where, orderBy, Firestore } from 'firebase/firestore';
import { db } from '../firebase/config';
import { 
  Box, 
  Typography, 
  Paper, 
  Alert, 
  CircularProgress, 
  Button, 
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';

const DeviceCollectionTest: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collections, setCollections] = useState<string[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [collectionName, setCollectionName] = useState('license_device_mapping');

  const checkCollections = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // This is a workaround since Firestore Web doesn't directly support listing collections
      // We'll check a few known collections manually
      const collectionsToCheck = [
        'license_device_mapping',
        'license_devices_count',
        'licenses',
        'user_profiles'
      ];
      
      const existingCollections = [];
      
      for (const collName of collectionsToCheck) {
        const colRef = collection(db, collName);
        const snapshot = await getDocs(colRef);
        if (!snapshot.empty) {
          existingCollections.push(`${collName} (${snapshot.size} docs)`);
        } else {
          existingCollections.push(`${collName} (empty)`);
        }
      }
      
      setCollections(existingCollections);
    } catch (err: any) {
      console.error('Error checking collections:', err);
      setError(`Failed to check collections: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const checkDocuments = async () => {
    if (!collectionName) return;
    
    setLoading(true);
    setError(null);
    setDocuments([]);
    
    try {
      const colRef = collection(db, collectionName);
      const snapshot = await getDocs(colRef);
      
      const docs: any[] = [];
      snapshot.forEach(doc => {
        docs.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setDocuments(docs);
      
      if (docs.length === 0) {
        setError(`No documents found in collection '${collectionName}'`);
      }
    } catch (err: any) {
      console.error(`Error fetching documents from ${collectionName}:`, err);
      setError(`Failed to fetch documents: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    checkCollections();
  }, []);
  
  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>
        Firestore Collection Diagnostic
      </Typography>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Available Collections
        </Typography>
        
        {loading && <CircularProgress size={24} sx={{ mr: 2 }} />}
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ mb: 2 }}>
          {collections.map((col, index) => (
            <Box key={index} sx={{ mb: 1 }}>
              <Typography variant="body2">{col}</Typography>
            </Box>
          ))}
        </Box>
        
        <Button 
          variant="outlined" 
          onClick={checkCollections}
          disabled={loading}
        >
          Refresh Collection List
        </Button>
      </Paper>
      
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          View Collection Documents
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TextField
            label="Collection Name"
            value={collectionName}
            onChange={(e) => setCollectionName(e.target.value)}
            size="small"
            sx={{ mr: 2 }}
          />
          
          <Button 
            variant="contained" 
            onClick={checkDocuments}
            disabled={loading || !collectionName}
          >
            View Documents
          </Button>
        </Box>
        
        {documents.length > 0 && (
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Document ID</TableCell>
                  <TableCell>Fields</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>{doc.id}</TableCell>
                    <TableCell>
                      <pre style={{ maxHeight: '120px', overflow: 'auto' }}>
                        {JSON.stringify(doc, null, 2)}
                      </pre>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
};

export default DeviceCollectionTest; 