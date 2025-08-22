import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  Users, TrendingUp, Plus, Star, LogIn, LogOut, Settings, Search, 
  Trophy, Target, Shield, CheckCircle, UserPlus, Share2, Bell, 
  Brain, Loader, MapPin, Clock, Award, Gamepad, AlertCircle,
  RefreshCw, ExternalLink, Calendar, Eye, Filter, Download
} from 'lucide-react';

interface APITeam {
  id: number;
  number: string;
  team_name: string;
  robot_name?: string;
  organization: string;
  location?: {
    city?: string;
    region?: string;
    country?: string;
  };
  registered?: boolean;
  program?: {
    code?: string;
  };
  grade?: string;
  wins?: number;
  losses?: number;
  ties?: number;
  wp?: number;
  ap?: number;
  sp?: number;
  skills_score?: number;
  auton_score?: number;
  driver_score?: number;
  endgame_score?: number;
  total_score?: number;
}

interface VEXTeam {
  id: number;
  number: string;
  team_name: string;
  robot_name: string;
  organization: string;
  location: {
    city: string;
    region: string;
    country: string;
  };
  registered: boolean;
  program: {
    code: string;
  };
  grade: string;
  wins: number;
  losses: number;
  ties: number;
  wp: number;
  ap: number;
  sp: number;
  skills_score: number;
  auton_score: number;
  driver_score: number;
  endgame_score: number;
  total_score: number;
}

type VEXTournament = {
  id: number;
  name: string;
  location: {
    venue: string;
    city: string;
    region: string;
    country: string;
  };
  start: string;
  end: string;
  season: string;
  program: {
    code: string;
  };
  level: string;
  teams_registered: number;
  divisions: number;
  status: string;
};

export const VEXScoutPro: React.FC = () => {
  // Authentication state with persistence
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('vexscout_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [loginForm, setLoginForm] = useState({ email: '', password: '', name: '' });
  const [isSignUp, setIsSignUp] = useState(false);

  // App state
  const [activeTab, setActiveTab] = useState('dashboard');
  const [teams, setTeams] = useState<VEXTeam[]>([]);
  const [tournaments, setTournaments] = useState<VEXTournament[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [loadingTournaments, setLoadingTournaments] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [favorites, setFavorites] = useState<{ teams: number[], tournaments: number[] }>(() => {
    const saved = localStorage.getItem('vexscout_favorites');
    return saved ? JSON.parse(saved) : { teams: [], tournaments: [] };
  });
  const [selectedSeason, setSelectedSeason] = useState('2024-2025');
  const [alliancePredictions, setAlliancePredictions] = useState([]);
  const [selectedTeam1, setSelectedTeam1] = useState('');
  const [selectedTeam2, setSelectedTeam2] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalTeams, setTotalTeams] = useState(0);
  const TEAMS_PER_PAGE = 50;

  // RobotEvents API configuration
  const ROBOTEVENTS_API = 'https://www.robotevents.com/api/v2';
  const ROBOTEVENTS_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIzIiwianRpIjoiOGRmYjBkNzEyMTgyY2Q5N2Q1M2FkYzMwMjg1NmQyZDkwNWQ4ZGE0MzhmMDE0YTk5Y2M5ZGE3MjMxZGVmNTFmNDMzNWY1MDkxYjM2YjViODgiLCJpYXQiOjE3NTU4NDI0OTYuMjUwMDI0MSwibmJmIjoxNzU1ODQyNDk2LjI1MDAyNzksImV4cCI6MjcwMjUyNzI5Ni4yMzg2NzgsInN1YiI6IjE0OTExOCIsInNjb3BlcyI6W119.qKygWXe41x-iMLzj9eVH5s3AsgQKXcHtUVgSYiYigqfEBQqdoP0IyYx5ox6ju9JbjkF0reF6o7_5TqUqnP6zgY9nhWGsXN0IJKDspfaSGMH0Lo2B6_0rmTy9E3bPFoXe9w173iT5RJLupXhbMxvbMmqFa17DIRVIFV8uvlRFFRvCQCWKQLGaRA_d4uHwpHWj7xSsfQuEHtPs-QWqZA4IkNg8o3H5lUygUqjNIwDwB07p4oe7DtaGx6vFZiQP2pv_RE1_L3QbB1llPwJJLXizkGlvlXpTw7mRqReppFh7Gs4zdZsh4pUediIzG2dJsIdWnMlny5PHUsuX2yEydHzdKuheLGyOi8NmCEYp9MNE-fbYr9lo6yE9G-YkfChmk3fTy37e8qdl4YNTIcCwbMXwaAjjV3EOIjD0Re7jT1hOzW-vD7kcD7x-a3E1WY3pkiaelUZbGSNFSzwQj1VrxGaUwR6zzjFV6O7b9cMyRNsG_iRCrViW8mqM3h_smysFDB1KGdzPAJnatS0TnPNncgVwEXzbeT3XTF7LYPSc_1IF7AdD8SIGjP6VZ8xs66wUDfsqdclnLHq7rDt_BFRXprSy4DyIvl3yAuVX2TWJNiqqwemIMIxvIvrPw70v78O5f-8BDmB3hr_GVfwsyHE_YZhSI_gwLO7PkneeIJpIHIzytPU';
  
  // Enhanced Firebase simulation with persistence
  const mockFirebase = {
    users: JSON.parse(localStorage.getItem('vexscout_users') || '[]'),

    createUserWithEmailAndPassword: async (email, password, displayName) => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (mockFirebase.users.find(u => u.email === email)) {
            reject(new Error('User already exists'));
            return;
          }

          const user = {
            uid: 'user_' + Date.now(),
            email,
            password, // Store password for mock auth
            displayName,
            createdAt: new Date().toISOString(),
            emailVerified: false
          };

          mockFirebase.users.push(user);
          localStorage.setItem('vexscout_users', JSON.stringify(mockFirebase.users));
          localStorage.setItem('vexscout_user', JSON.stringify(user));
          resolve(user);
        }, 1000);
      });
    },

    signInWithEmailAndPassword: async (email, password) => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const user = mockFirebase.users.find(u => u.email === email && u.password === password);
          if (!user) {
            reject(new Error('Invalid email or password. Please try again or sign up.'));
            return;
          }

          localStorage.setItem('vexscout_user', JSON.stringify(user));
          resolve(user);
        }, 1000);
      });
    },

    signOut: async () => {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          localStorage.removeItem('vexscout_user');
          resolve();
        }, 500);
      });
    }
  };

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('vexscout_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Fetch teams from RobotEvents API with pagination
  const fetchVEXTeams = async (season = '2024-2025', program = 'VRC', page = 1): Promise<void> => {
    setLoadingTeams(true);
    try {
      const response = await fetch(
        `${ROBOTEVENTS_API}/teams?season[]=${season}&program[]=${program}&page=${page}&per_page=${TEAMS_PER_PAGE}`,
        {
          headers: {
            'Authorization': `Bearer ${ROBOTEVENTS_TOKEN}`,
            'Accept': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch teams');
      }

      const data = await response.json();
      const fetchedTeams: VEXTeam[] = data.data.map((apiTeam: APITeam) => ({
        id: apiTeam.id,
        number: apiTeam.number,
        team_name: apiTeam.team_name,
        robot_name: apiTeam.robot_name || '',
        organization: apiTeam.organization,
        location: {
          city: apiTeam.location?.city || '',
          region: apiTeam.location?.region || '',
          country: apiTeam.location?.country || ''
        },
        registered: apiTeam.registered || true,
        program: {
          code: apiTeam.program?.code || ''
        },
        grade: apiTeam.grade || '',
        wins: apiTeam.wins || 0,
        losses: apiTeam.losses || 0,
        ties: apiTeam.ties || 0,
        wp: apiTeam.wp || 0,
        ap: apiTeam.ap || 0,
        sp: apiTeam.sp || 0,
        skills_score: apiTeam.skills_score || 0,
        auton_score: apiTeam.auton_score || 0,
        driver_score: apiTeam.driver_score || 0,
        endgame_score: apiTeam.endgame_score || 0,
        total_score: apiTeam.total_score || 0
      }));

      if (page === 1) {
        setTeams(fetchedTeams);
        setTotalTeams(data.meta?.total || fetchedTeams.length);
      } else {
        setTeams(prev => [...prev, ...fetchedTeams]);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
      setAuthError('Failed to fetch team data from RobotEvents API');
    } finally {
      setLoadingTeams(false);
    }
  };

  // Fetch current and upcoming VEX tournaments
  const fetchVEXTournaments = async (season = '2024-2025') => {
    setLoadingTournaments(true);
    try {
      const currentDate = new Date().toISOString();
      
      const response = await fetch(`${ROBOTEVENTS_API}/events?season[]=${season}&start=${currentDate}&per_page=100`, {
        headers: {
          'Authorization': `Bearer ${ROBOTEVENTS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tournaments');
      }

      const data = await response.json();
      const tournaments = data.data.map(event => ({
        id: event.id,
        name: event.name,
        location: {
          venue: event.venue,
          city: event.location?.city || '',
          region: event.location?.region || '',
          country: event.location?.country || '',
        },
        start: event.start,
        end: event.end,
        season: event.season?.name || '',
        program: { code: event.program?.code || '' },
        level: event.level,
        teams_registered: event.teams_registered || 0,
        divisions: event.divisions?.length || 1,
        status: 'upcoming'
      }));
      
      setTournaments(tournaments);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    } finally {
      setLoadingTournaments(false);
    }
  };

  // Load more teams
  const loadMoreTeams = () => {
    if (!loadingTeams && teams.length < totalTeams) {
      const nextPage = Math.floor(teams.length / TEAMS_PER_PAGE) + 1;
      fetchVEXTeams(selectedSeason, 'VRC', nextPage);
    }
  };

  // Load data when user logs in
  useEffect(() => {
    if (user) {
      fetchVEXTeams(selectedSeason);
      fetchVEXTournaments(selectedSeason);
    }
  }, [user, selectedSeason]);

  // Authentication functions
  const handleEmailAuth = async () => {
    if (!loginForm.email.includes('@')) {
      setAuthError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setAuthError('');
    
    try {
      let authUser;
      if (isSignUp) {
        if (!loginForm.name || !loginForm.email || !loginForm.password) {
          setAuthError('Please fill in all fields');
          setLoading(false);
          return;
        }
        if (loginForm.password.length < 6) {
          setAuthError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }
        authUser = await mockFirebase.createUserWithEmailAndPassword(
          loginForm.email, loginForm.password, loginForm.name
        );
      } else {
        if (!loginForm.email || !loginForm.password) {
          setAuthError('Please enter email and password');
          setLoading(false);
          return;
        }
        authUser = await mockFirebase.signInWithEmailAndPassword(
          loginForm.email, loginForm.password
        );
      }
      
      setUser(authUser);
      setLoginForm({ email: '', password: '', name: '' });
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await mockFirebase.signOut();
      setUser(null);
      setTeams([]);
      setTournaments([]);
      setActiveTab('dashboard');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Alliance prediction with enhanced algorithm
  const predictAlliance = (team1, team2) => {
    if (!team1 || !team2) return null;
    
    const combinedScore = Math.round((team1.total_score + team2.total_score) * 0.9); // Slight reduction for alliance coordination
    const avgWP = (team1.wp + team2.wp) / 2;
    const avgSP = (team1.sp + team2.sp) / 2;
    const avgSkills = (team1.skills_score + team2.skills_score) / 2;
    
    // More sophisticated win probability calculation
    const baseWinProb = avgWP * 75; // Base from win percentage
    const skillsBonus = (avgSkills > 200) ? 10 : (avgSkills > 150) ? 5 : 0;
    const scoreBonus = (combinedScore > 300) ? 8 : (combinedScore > 250) ? 4 : 0;
    
    const winProbability = Math.min(95, Math.max(5, baseWinProb + skillsBonus + scoreBonus));
    
    // Confidence based on data quality and consistency
    const team1Consistency = 1 - Math.abs(team1.total_score - (team1.auton_score + team1.driver_score + team1.endgame_score)) / team1.total_score;
    const team2Consistency = 1 - Math.abs(team2.total_score - (team2.auton_score + team2.driver_score + team2.endgame_score)) / team2.total_score;
    const avgConsistency = (team1Consistency + team2Consistency) / 2;
    const confidence = Math.round(70 + (avgConsistency * 25));
    
    return {
      id: Date.now(),
      teams: [
        { number: team1.number, name: team1.team_name }, 
        { number: team2.number, name: team2.team_name }
      ],
      predictedScore: combinedScore,
      winProbability: Math.round(winProbability),
      avgSkills: Math.round(avgSkills),
      confidence: confidence,
      createdAt: new Date().toLocaleString(),
      createdBy: user.displayName || user.email.split('@')[0],
      breakdown: {
        autonScore: Math.round((team1.auton_score + team2.auton_score) * 0.95),
        driverScore: Math.round((team1.driver_score + team2.driver_score) * 0.9),
        endgameScore: Math.round((team1.endgame_score + team2.endgame_score) * 0.85)
      }
    };
  };

  const runAllianceSimulation = () => {
    const team1 = teams.find(t => t.id === parseInt(selectedTeam1));
    const team2 = teams.find(t => t.id === parseInt(selectedTeam2));
    
    const prediction = predictAlliance(team1, team2);
    if (prediction) {
      setAlliancePredictions([prediction, ...alliancePredictions.slice(0, 19)]); // Keep 20 predictions
    }
  };

  // Toggle favorites
  const toggleFavorite = (type, id) => {
    setFavorites(prev => ({
      ...prev,
      [type]: prev[type].includes(id) 
        ? prev[type].filter(fid => fid !== id)
        : [...prev[type], id]
    }));
  };

  // Enhanced team filtering
  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         team.team_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         team.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         team.location.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         team.location.region.toLowerCase().includes(searchQuery.toLowerCase());
                         
    const matchesFilter = filterCategory === 'all' || 
                         (filterCategory === 'favorites' && favorites.teams.includes(team.id)) ||
                         (filterCategory === 'high-scoring' && team.total_score > 150) ||
                         (filterCategory === 'top-performers' && team.wp > 0.7) ||
                         (filterCategory === 'middle-school' && team.grade === 'Middle School') ||
                         (filterCategory === 'high-school' && team.grade === 'High School') ||
                         (filterCategory === 'struggling' && team.wp < 0.3) ||
                         (filterCategory === 'improving' && team.wp >= 0.3 && team.wp < 0.6);
    return matchesSearch && matchesFilter;
  });

  // Chart data for all teams
  const chartData = teams.slice(0, 10).map(team => ({
    name: team.number,
    score: team.total_score,
    skills: team.skills_score,
    winRate: Math.round(team.wp * 100),
    wins: team.wins,
    losses: team.losses
  }));

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

  // Performance distribution data
  const performanceDistribution = [
    { name: 'Elite (80%+ WR)', value: teams.filter(t => t.wp >= 0.8).length, color: '#10B981' },
    { name: 'Strong (60-79% WR)', value: teams.filter(t => t.wp >= 0.6 && t.wp < 0.8).length, color: '#3B82F6' },
    { name: 'Average (40-59% WR)', value: teams.filter(t => t.wp >= 0.4 && t.wp < 0.6).length, color: '#F59E0B' },
    { name: 'Developing (20-39% WR)', value: teams.filter(t => t.wp >= 0.2 && t.wp < 0.4).length, color: '#EF4444' },
    { name: 'Learning (<20% WR)', value: teams.filter(t => t.wp < 0.2).length, color: '#6B7280' }
  ];

  // Login Screen (unchanged but with better persistence messaging)
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">VEX Scout Pro</h1>
            <p className="text-gray-600">Enhanced VEX V5 scouting with RobotEvents integration</p>
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-700">
                <CheckCircle className="w-4 h-4 inline mr-1" />
                All teams • Real events • Persistent login • Enhanced predictions
              </p>
            </div>
          </div>
          
          {authError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              {authError}
            </div>
          )}

          <div className="space-y-4">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setIsSignUp(false)}
                className={`flex-1 py-2 px-4 font-medium ${!isSignUp ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
              >
                Sign In
              </button>
              <button
                onClick={() => setIsSignUp(true)}
                className={`flex-1 py-2 px-4 font-medium ${isSignUp ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
              >
                Sign Up
              </button>
            </div>
            
            {isSignUp && (
              <input
                type="text"
                placeholder="Full Name"
                value={loginForm.name}
                onChange={(e) => setLoginForm({...loginForm, name: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            )}
            
            <input
              type="email"
              placeholder="Email Address"
              value={loginForm.email}
              onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
            
            <input
              type="password"
              placeholder="Password"
              value={loginForm.password}
              onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
            
            <button
              onClick={handleEmailAuth}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-300 transition-colors flex items-center justify-center"
            >
              {loading ? <Loader className="w-5 h-5 animate-spin" /> : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>
          </div>
          
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Your login will be saved for future visits</p>
          </div>
        </div>
      </div>
    );
  }

  // Main Application
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">VEX Scout Pro</h1>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>Season {selectedSeason}</span>
                  <span>•</span>
                  <span>{teams.length} teams loaded</span>
                  {totalTeams > teams.length && (
                    <>
                      <span>•</span>
                      <span>{totalTeams - teams.length} more available</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-green-100 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-700 font-medium">RobotEvents Connected</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">
                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{user.displayName || user.email}</div>
                </div>
                <button
                  onClick={handleLogout}
                  disabled={loading}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg disabled:opacity-50"
                >
                  {loading ? <Loader className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
              { id: 'teams', label: 'All Teams', icon: Users },
              { id: 'alliance', label: 'Alliance Simulator', icon: Target },
              { id: 'tournaments', label: 'Upcoming Events', icon: Trophy },
              { id: 'favorites', label: 'Favorites', icon: Star }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
                <p className="text-gray-600">Welcome back, {user.displayName || user.email.split('@')[0]}!</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setCurrentPage(1);
                    setTeams([]);
                    fetchVEXTeams(selectedSeason);
                    fetchVEXTournaments(selectedSeason);
                  }}
                  disabled={loadingTeams || loadingTournaments}
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${(loadingTeams || loadingTournaments) ? 'animate-spin' : ''}`} />
                  <span>Refresh Data</span>
                </button>
              </div>
            </div>

            {/* Enhanced Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Teams Loaded</p>
                    <p className="text-3xl font-bold text-blue-600">{teams.length}</p>
                    <p className="text-xs text-gray-500 mt-1">of {totalTeams} total teams</p>
                  </div>
                  <Users className="w-12 h-12 text-blue-500" />
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Upcoming Events</p>
                    <p className="text-3xl font-bold text-purple-600">{tournaments.length}</p>
                    <p className="text-xs text-gray-500 mt-1">Current season</p>
                  </div>
                  <Trophy className="w-12 h-12 text-purple-500" />
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg Score</p>
                    <p className="text-3xl font-bold text-green-600">
                      {teams.length > 0 ? Math.round(teams.reduce((sum, t) => sum + t.total_score, 0) / teams.length) : 0}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">All teams average</p>
                  </div>
                  <Target className="w-12 h-12 text-green-500" />
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Elite Teams</p>
                    <p className="text-3xl font-bold text-orange-600">
                      {teams.filter(t => t.wp >= 0.8).length}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">80%+ win rate</p>
                  </div>
                  <Award className="w-12 h-12 text-orange-500" />
                </div>
              </div>
            </div>

            {/* Performance Distribution Chart */}
            {teams.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Team Performance Distribution</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={performanceDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {performanceDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Top 10 Teams Performance</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="score" fill="#3B82F6" name="Match Score" />
                      <Bar dataKey="skills" fill="#10B981" name="Skills Score" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Quick Insights */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Insights</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-600">
                    {teams.length > 0 ? Math.max(...teams.map(t => t.total_score)) : 0}
                  </div>
                  <div className="text-sm text-gray-600">Highest Match Score</div>
                  <div className="text-xs text-blue-600 mt-1">
                    {teams.length > 0 ? teams.find(t => t.total_score === Math.max(...teams.map(t => t.total_score)))?.number : 'N/A'}
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {teams.length > 0 ? Math.max(...teams.map(t => t.skills_score)) : 0}
                  </div>
                  <div className="text-sm text-gray-600">Highest Skills Score</div>
                  <div className="text-xs text-green-600 mt-1">
                    {teams.length > 0 ? teams.find(t => t.skills_score === Math.max(...teams.map(t => t.skills_score)))?.number : 'N/A'}
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-600">
                    {teams.length > 0 ? Math.round(Math.max(...teams.map(t => t.wp)) * 100) : 0}%
                  </div>
                  <div className="text-sm text-gray-600">Best Win Rate</div>
                  <div className="text-xs text-purple-600 mt-1">
                    {teams.length > 0 ? teams.find(t => t.wp === Math.max(...teams.map(t => t.wp)))?.number : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Teams Tab */}
        {activeTab === 'teams' && (
          <div className="space-y-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">All VEX V5 Teams</h2>
                <p className="text-gray-600">Showing {filteredTeams.length} of {teams.length} loaded teams</p>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
                <div className="flex items-center space-x-2">
                  <Search className="w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search teams, organizations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-64"
                  />
                </div>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Teams</option>
                  <option value="favorites">⭐ Favorites</option>
                  <option value="top-performers">🏆 Elite (70%+ WR)</option>
                  <option value="high-scoring">🎯 High Scoring (150+ pts)</option>
                  <option value="improving">📈 Improving (30-60% WR)</option>
                  <option value="struggling">📚 Learning (&lt;30% WR)</option>
                  <option value="high-school">🎓 High School</option>
                  <option value="middle-school">👨‍🎓 Middle School</option>
                </select>
              </div>
            </div>

            {loadingTeams ? (
              <div className="flex justify-center items-center py-16">
                <div className="text-center">
                  <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600">Loading VEX teams from RobotEvents API...</p>
                  <p className="text-sm text-gray-500 mt-2">This may take a moment</p>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTeams.map((team) => (
                    <div key={team.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-200 border-l-4 border-l-blue-500">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-sm ${
                            team.wp >= 0.8 ? 'bg-green-600' : 
                            team.wp >= 0.6 ? 'bg-blue-600' : 
                            team.wp >= 0.4 ? 'bg-yellow-600' : 
                            team.wp >= 0.2 ? 'bg-orange-600' : 'bg-red-600'
                          }`}>
                            {team.number}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{team.team_name}</h3>
                            <p className="text-sm text-gray-500 flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              {team.location.city}, {team.location.region}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleFavorite('teams', team.id)}
                          className={`p-2 rounded-full transition-colors ${
                            favorites.teams.includes
                              ? 'text-yellow-500 hover:text-yellow-600'
                              : 'text-gray-400 hover:text-gray-500'
                          }`}
                        >
                          <Star className={`w-5 h-5 ${favorites.teams.includes(team.id) ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                      
                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Match Score:</span>
                          <span className={`font-bold text-xl ${
                            team.total_score >= 180 ? 'text-green-600' : 
                            team.total_score >= 120 ? 'text-blue-600' : 
                            team.total_score >= 80 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {team.total_score}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="text-center p-2 bg-blue-50 rounded">
                            <div className="font-semibold text-blue-600">{team.auton_score}</div>
                            <div className="text-gray-600">Auton</div>
                          </div>
                          <div className="text-center p-2 bg-green-50 rounded">
                            <div className="font-semibold text-green-600">{team.driver_score}</div>
                            <div className="text-gray-600">Driver</div>
                          </div>
                          <div className="text-center p-2 bg-purple-50 rounded">
                            <div className="font-semibold text-purple-600">{team.endgame_score}</div>
                            <div className="text-gray-600">Endgame</div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Skills Score:</span>
                            <span className="font-semibold text-orange-600">{team.skills_score}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Win Rate:</span>
                            <div className="flex items-center space-x-2">
                              <span className={`font-semibold ${
                                team.wp >= 0.8 ? 'text-green-600' : 
                                team.wp >= 0.6 ? 'text-blue-600' : 
                                team.wp >= 0.4 ? 'text-yellow-600' : 
                                team.wp >= 0.2 ? 'text-orange-600' : 'text-red-600'
                              }`}>
                                {Math.round(team.wp * 100)}%
                              </span>
                              {team.wp >= 0.8 && <Award className="w-4 h-4 text-yellow-500" />}
                            </div>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Record:</span>
                            <span className="font-semibold text-gray-800">{team.wins}-{team.losses}-{team.ties}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Grade:</span>
                            <span className="font-medium text-gray-700">{team.grade}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border-t pt-3">
                        <p className="text-xs text-gray-500 mb-2">Organization:</p>
                        <p className="text-sm font-medium text-gray-700 mb-1">{team.organization}</p>
                        <p className="text-xs text-gray-500">Robot: <span className="font-medium">{team.robot_name}</span></p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Load More Button */}
                {teams.length < totalTeams && !loadingTeams && (
                  <div className="text-center">
                    <button
                      onClick={loadMoreTeams}
                      className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
                    >
                      <Download className="w-5 h-5" />
                      <span>Load More Teams ({totalTeams - teams.length} remaining)</span>
                    </button>
                  </div>
                )}

                {filteredTeams.length === 0 && !loadingTeams && (
                  <div className="text-center py-16 text-gray-500">
                    <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-lg font-medium">No teams found</p>
                    <p className="text-sm">Try adjusting your search or filter criteria</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );