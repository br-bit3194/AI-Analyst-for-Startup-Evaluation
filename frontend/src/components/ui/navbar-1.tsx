"use client"

import * as React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X } from "lucide-react"
import Image from "next/image"

const Navbar1 = () => {
  const [isOpen, setIsOpen] = useState(false)
  const toggleMenu = () => setIsOpen(!isOpen)

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="flex justify-center w-full py-6 px-4">
        <div className="flex items-center justify-between px-6 py-3 bg-white/80 backdrop-blur-sm rounded-full shadow-lg w-full max-w-7xl relative z-10">
          <div className="flex items-center">
            <motion.div
              className="w-10 h-10 mr-6 overflow-hidden rounded-full"
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
          </div>
        
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {["Home", "Features", "Pricing", "About"].map((item) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                whileHover={{ scale: 1.05 }}
              >
                <a href={`#${item.toLowerCase()}`} className="text-sm text-gray-900 hover:text-primary transition-colors font-medium">
                  {item}
                </a>
              </motion.div>
            ))}
          </nav>

          {/* Desktop CTA Button */}
          <motion.div
            className="hidden md:block"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            whileHover={{ scale: 1.05 }}
          >
            <a
              href="#contact"
              className="inline-flex items-center justify-center px-5 py-2 text-sm text-gray-900 font-medium bg-primary rounded-full hover:bg-primary/90 transition-colors"
            >
              Get Started
            </a>
          </motion.div>

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
              <div className="flex flex-col space-y-6">
                {["Home", "Features", "Pricing", "About"].map((item, i) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 + 0.1 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <a 
                      href={`#${item.toLowerCase()}`} 
                      className="text-base text-gray-900 font-medium hover:text-primary" 
                      onClick={toggleMenu}
                    >
                      {item}
                    </a>
                  </motion.div>
                ))}

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="pt-6"
                >
                  <a
                    href="#contact"
                    className="inline-flex items-center justify-center w-full px-5 py-3 text-base text-gray-900 font-medium bg-primary rounded-full hover:bg-primary/90 transition-colors"
                    onClick={toggleMenu}
                  >
                    Get Started
                  </a>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default Navbar1
