"use client"

import * as React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X, User, LogOut } from "lucide-react"
import Image from "next/image"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "./button"
import Link from "next/link"

const Navbar1 = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { user, signInWithGoogle, signOut } = useAuth()
  const toggleMenu = () => setIsOpen(!isOpen)

  const handleSignIn = async () => {
    try {
      await signInWithGoogle()
    } catch (error) {
      console.error('Error signing in:', error)
    }
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="flex justify-center w-full py-6 px-4">
        <div className="flex items-center justify-between px-6 py-3 bg-white/80 backdrop-blur-sm rounded-full shadow-lg w-full max-w-7xl relative z-10">
          <div className="flex items-center">
            <motion.div
              className="w-10 h-10 overflow-hidden rounded-full"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              whileHover={{ rotate: 10 }}
              transition={{ duration: 0.3 }}
            >
              <Image 
                src="/startalytica_icon.jpeg" 
                alt="Startalytica Logo"
                width={40}
                height={40}
                className="w-full h-full object-cover"
                priority
              />
            </motion.div>
            
            {/* Desktop Navigation Links - Left side */}
            <nav className="hidden md:flex items-center space-x-6 ml-6">
              {["Home", "Features", "Pricing", "About"].map((item) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <a 
                    href={`#${item.toLowerCase()}`} 
                    className="text-sm text-gray-900 hover:text-primary transition-colors font-medium"
                  >
                    {item}
                  </a>
                </motion.div>
              ))}
            </nav>
          </div>
          
          {/* Auth Buttons - Right side */}
          <div className="flex items-center">
            {user ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="flex items-center space-x-4"
              >
                <span className="text-sm font-medium text-gray-700">
                  {user.displayName || 'User'}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={signOut}
                  className="flex items-center space-x-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </Button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <Button
                  onClick={handleSignIn}
                  className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <User className="h-4 w-4" />
                  <span>Sign In</span>
                </Button>
              </motion.div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <motion.button 
            className="md:hidden flex items-center" 
            onClick={toggleMenu} 
            whileTap={{ scale: 0.9 }}
            aria-label="Toggle menu"
          >
            <Menu className="h-6 w-6 text-gray-900" />
          </motion.button>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="fixed inset-0 bg-white/95 backdrop-blur-sm z-50 pt-24 px-6 md:hidden"
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <motion.button
                className="absolute top-6 right-6 p-2"
                onClick={toggleMenu}
                whileTap={{ scale: 0.9 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                aria-label="Close menu"
              >
                <X className="h-6 w-6 text-gray-900" />
              </motion.button>
              <div className="flex flex-col space-y-4">
                {["Home", "Features", "Pricing", "About"].map((item) => (
                  <Link
                    key={item}
                    href={`#${item.toLowerCase()}`}
                    className="text-lg text-gray-900 hover:text-primary transition-colors py-2"
                    onClick={() => setIsOpen(false)}
                  >
                    {item}
                  </Link>
                ))}
                
                {user ? (
                  <div className="pt-4 border-t border-gray-200 mt-4">
                    <div className="text-sm font-medium text-gray-700 mb-3">
                      {user.displayName || 'User'}
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        signOut();
                        setIsOpen(false);
                      }}
                      className="w-full flex items-center justify-center space-x-2"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => {
                      handleSignIn();
                      setIsOpen(false);
                    }}
                    className="mt-2 w-full flex items-center justify-center space-x-2"
                  >
                    <User className="h-4 w-4" />
                    <span>Sign In</span>
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default Navbar1
